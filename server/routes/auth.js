import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";
import User from "../models/User.js";
import { welcomeTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.js";
import { generateToken } from "../utils/generateToken.js";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.VITE_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BANNED_USERNAMES = [
  "login",
  "signup",
  "directory",
  "admin-dashboard",
  "artisan-dashboard",
  "support",
  "help-center",
  "about",
  "contact",
  "privacy",
  "terms",
  "faq",
];

// @route   POST api/auth/signup-customer
router.post(
  "/signup-customer",
  [
    check("email", "Please include a valid email").isEmail().normalizeEmail(),
    check("password", "Password must be 6+ characters").isLength({ min: 6 }),
    check("firstName", "First name is required").notEmpty().trim(),
    check("lastName", "Last name is required").notEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });
    const { email, password, firstName, lastName, lga, coordinates } = req.body;

    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: "User already exists" });

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // GENERATE 6-DIGIT OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      user = new User({
        email,
        password: hashedPassword,
        role: "customer",
        firstName,
        lastName,
        emailVerificationOTP: otp,
        otpExpires: otpExpires,
        lastOtpSentAt: new Date(), // Track initial generation timestamp
        otpResendCount: 0,
        customerProfile: { lga: lga },
      });

      if (coordinates) {
        user.customerProfile.location = { type: "Point", coordinates };
      }

      await user.save();

      await sendEmail(
        user.email,
        "Your Verification Code - Abeg Fix",
        welcomeTemplate(user.firstName, otp, user.role),
      );

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      await sendEmail(
        user.email,
        "Your Verification Code - Abeg Fix",
        welcomeTemplate(user.firstName, otp, user.role),
      );

      return res.status(201).json({
        token,
        role: user.role,
        msg: "Registration successful. Check your email for OTP.",
      });
    } catch (err) {
      console.error("Signup Error:", err);
      res.status(500).json({ msg: "Server error during registration" });
    }
  },
);

// @route   POST api/auth/signup-artisan
router.post(
  "/signup-artisan",
  [
    check("email", "Please include a valid email").isEmail().normalizeEmail(),
    check("password", "Password must be 6+ characters").isLength({ min: 6 }),
    check("firstName", "First name is required").notEmpty().trim(),
    check("lastName", "Last name is required").notEmpty().trim(),
    check("whatsapp", "WhatsApp number is required for artisans").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const {
      email,
      password,
      firstName,
      lastName,
      category,
      whatsapp,
      address,
      businessName,
      coords,
      username,
    } = req.body;

    if (!address || !coords) {
      return res
        .status(400)
        .json({ msg: "Business shop location data is required." });
    }

    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: "User already exists" });

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      user = new User({
        email,
        password: hashedPassword,
        role: "artisan",
        firstName,
        username,
        lastName,
        emailVerificationOTP: otp,
        otpExpires: otpExpires,
        lastOtpSentAt: new Date(), // Track initial generation timestamp
        otpResendCount: 0,
        artisanProfile: {
          category,
          whatsapp,
          businessName,
          address,
          location: {
            type: "Point",
            coordinates: [
              Number(coords[0]), // Longitude (e.g., 3.3347)
              Number(coords[1]), // Latitude (e.g., 6.6306)
            ],
          },
        },
      });

      await user.save();

      await sendEmail(
        user.email,
        "Your Verification Code - Abeg Fix",
        welcomeTemplate(user.firstName, otp, user.role),
      );

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );

      return res.status(201).json({
        token,
        role: user.role,
        msg: "Registration successful. Check your email for OTP.",
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error");
    }
  },
);

// @route   POST api/auth/login
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password",
      );

      if (!user) {
        return res
          .status(401)
          .json({ msg: "Invalid credentials (User not found)" });
      }

      if (!user.isEmailVerified) {
        return res.status(403).json({ msg: "Please verify your email first." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ msg: "Invalid credentials (Wrong password)" });
      }

      const token = generateToken(user._id);
      res.json({
        token,
        user: { id: user._id, role: user.role, firstName: user.firstName },
      });
    } catch (err) {
      res.status(500).send("Server error");
    }
  },
);

// @route   POST api/auth/verify-email
router.post("/verify-email", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isEmailVerified)
      return res.status(400).json({ msg: "Email already verified" });

    if (user.emailVerificationOTP !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.otpExpires = undefined;
    user.otpResendCount = undefined;
    user.lastOtpSentAt = undefined;
    await user.save();

    const token = generateToken(user._id);
    return res.json({
      msg: "Email verified successfully!",
      token: token,
      user: {
        id: user._id,
        role: user.role,
        firstName: user.firstName,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error" });
  }
});

// @route   PUT api/auth/update-password
router.put("/update-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    res.json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/auth/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (
      user.role === "artisan" &&
      user.artisanProfile.subscriptionTier === "pro" &&
      user.artisanProfile.proExpiresAt &&
      new Date() > user.artisanProfile.proExpiresAt
    ) {
      user.artisanProfile.subscriptionTier = "free";
      user.artisanProfile.proExpiresAt = null;
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST api/auth/resend-otp
// Implements: Cooldown, OTP reuse, and maximum request caps
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isEmailVerified)
      return res.status(400).json({ msg: "Email already verified" });

    // 1. HARD MAXIMUM CAP GUARD (Max 3 resends per activation flow)
    if (user.otpResendCount >= 3) {
      return res.status(429).json({
        msg: "Maximum verification attempts reached. Please contact support if you need assistance.",
      });
    }

    // 2. COOLDOWN GUARD (Must wait 60 seconds before triggering a new delivery)
    const now = Date.now();
    if (
      user.lastOtpSentAt &&
      now - new Date(user.lastOtpSentAt).getTime() < 60000
    ) {
      const remainingSeconds = Math.ceil(
        (60000 - (now - new Date(user.lastOtpSentAt).getTime())) / 1000,
      );
      return res.status(429).json({
        msg: `Please wait ${remainingSeconds} seconds before requesting another code.`,
      });
    }

    // 3. OTP REUSE LOGIC
    let activeOtp = user.emailVerificationOTP;

    // If the old OTP expired, or somehow doesn't exist, generate a brand new one
    if (!activeOtp || !user.otpExpires || user.otpExpires < now) {
      activeOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailVerificationOTP = activeOtp;
    }

    // Extend or reset validation duration for 10 minutes from this update execution
    user.otpExpires = now + 10 * 60 * 1000;
    user.lastOtpSentAt = new Date();
    user.otpResendCount += 1;

    await user.save();

    // Outbound infrastructure execution
    await sendEmail(
      user.email,
      "Your Verification Code - Abeg Fix",
      welcomeTemplate(user.firstName, activeOtp, user.role),
    );

    res.json({ msg: "Verification code sent successfully to your email." });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/forgot-password
// Implements: 30-minute operational cooldown window
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });

    // Security Best Practice: Don't explicitly reveal to scrapers if an email doesn't exist.
    if (!user) {
      return res.json({
        msg: "If that email matches an account, a reset link has been dispatched.",
      });
    }

    // 4. THIRTY-MINUTE COOLDOWN GUARD
    const now = Date.now();
    if (
      user.lastPasswordResetSentAt &&
      now - new Date(user.lastPasswordResetSentAt).getTime() < 30 * 60 * 1000
    ) {
      const remainingMinutes = Math.ceil(
        (30 * 60 * 1000 -
          (now - new Date(user.lastPasswordResetSentAt).getTime())) /
          60000,
      );
      return res.status(429).json({
        msg: `A recovery link was recently dispatched. Please wait ${remainingMinutes} minutes before requesting another.`,
      });
    }

    // Track the transmission timestamp before passing handling off to controller logic
    user.lastPasswordResetSentAt = new Date();
    await user.save();

    // Forward down execution pipeline to your pre-existing controller
    return forgotPassword(req, res);
  } catch (err) {
    console.error("Forgot Password Guard Error:", err);
    res.status(500).send("Server error");
  }
});

router.put("/update-profile", protect, authorize("artisan"), updateProfile);
router.post("/reset-password/:token", resetPassword);

// @desc    Delete image from Cloudinary and MongoDB
router.put("/delete-portfolio-image", protect, async (req, res) => {
  const { imageUrl } = req.body;
  const userId = req.user.id;

  try {
    const regex = /\/v\d+\/(.+)\./;
    const match = imageUrl.match(regex);
    const publicId = match ? match[1] : null;

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { "artisanProfile.portfolio": imageUrl } },
      { new: true },
    );

    res.json({
      msg: "Image deleted successfully",
      portfolio: user.artisanProfile.portfolio,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.put("/update-customer", protect, async (req, res) => {
  const { firstName, lastName, phoneNumber } = req.body;

  try {
    const updateFields = {};

    if (firstName !== undefined) updateFields.firstName = firstName.trim();
    if (lastName !== undefined) updateFields.lastName = lastName.trim();

    if (phoneNumber !== undefined) {
      updateFields["customerProfile.phoneNumber"] = phoneNumber.trim();
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Update Profile Error:", err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

// API Route: GET /api/auth/check-username?username=tunde
router.get("/check-username", async (req, res) => {
  const { username } = req.query;

  if (!username)
    return res
      .status(400)
      .json({ msg: "Username query parameter is required." });

  if (BANNED_USERNAMES.includes(username.toLowerCase())) {
    return res
      .status(200)
      .json({ available: false, msg: "Reserved system keyword" });
  }

  try {
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });

    if (existingUser) {
      return res.json({
        available: false,
        msg: "❌ This username is already taken.",
      });
    }

    return res.json({ available: true, msg: "✅ Username is available!" });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

export default router;
