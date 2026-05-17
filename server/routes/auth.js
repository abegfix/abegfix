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
        customerProfile: { lga: lga },
      });

      if (coordinates) {
        user.customerProfile.location = { type: "Point", coordinates };
      }

      await user.save();

      // SEND THE EMAIL
      try {
        await sendEmail(
          user.email,
          "Verify your Abeg Fix Account",
          welcomeTemplate(user.firstName, otp, "Customer"),
        );
        // Do NOT send a res.json here
      } catch (mailErr) {
        console.error("Email failed to send:", mailErr);
        // Just log it. The user is already saved.
      }

      // ONLY SEND ONE RESPONSE AT THE VERY END
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

    const { email, password, firstName, lastName, category, whatsapp } =
      req.body;

    try {
      let user = await User.findOne({ email });
      if (user) return res.status(400).json({ msg: "User already exists" });

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);

      // GENERATE 6-DIGIT OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Inside signup-artisan
      user = new User({
        email,
        password: hashedPassword,
        role: "artisan",
        firstName,
        lastName,
        emailVerificationOTP: otp,
        otpExpires: otpExpires,
        artisanProfile: {
          category,
          whatsapp,
          businessName: `${firstName}'s Services`,
          // IMPORTANT: Do not define location here yet if you don't have coordinates
        },
      });

      // For artisans, you'll likely update location later in their dashboard,
      // so ensure the object isn't partially initialized now.
      user.artisanProfile.location = undefined;

      await user.save();

      // SEND THE EMAIL
      try {
        await sendEmail(
          user.email,
          "Verify your Abeg Fix Account",
          welcomeTemplate(user.firstName, otp, "Artisan"),
        );
        // Do NOT send a res.json here
      } catch (mailErr) {
        console.error("Email failed to send:", mailErr);
        // Just log it. The user is already saved.
      }

      // ONLY SEND ONE RESPONSE AT THE VERY END
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
// @desc    Authenticate user & get token
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
      // 1. Find user and EXPLICITLY include password if your model hides it by default

      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password",
      );

      if (!user) {
        return res

          .status(401)

          .json({ msg: "Invalid credentials (User not found)" });
      }

      // 2. Check if verified (Don't let unverified users log in!)

      if (!user.isEmailVerified) {
        return res.status(403).json({ msg: "Please verify your email first." });
      }

      // 3. Compare hashed password

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res

          .status(401)

          .json({ msg: "Invalid credentials (Wrong password)" });
      }

      // 4. Generate Token and Send Response

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
  const { email, otp } = req.body; // Expect email from body now

  try {
    // Find user by email instead of ID
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isEmailVerified)
      return res.status(400).json({ msg: "Email already verified" });

    // Verify OTP and Expiry
    if (user.emailVerificationOTP !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.otpExpires = undefined;
    await user.save();
    // NEW: Generate a fresh token for auto-login
    const token = generateToken(user._id); // Use your existing token generator

    // NEW: Send back the token and user role so the frontend can route them
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
// @desc    Update user password
router.put("/update-password", protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // 1. Get user and explicitly select the password field (since we usually hide it)
    const user = await User.findById(req.user.id);

    // 2. Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect current password" });
    }

    // 3. Hash new password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);

    // 4. Save
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
    // req.user.id comes from the 'protect' middleware
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Check if subscription has expired
    if (
      user.role === "artisan" &&
      user.artisanProfile.subscriptionTier === "pro" &&
      user.artisanProfile.proExpiresAt &&
      new Date() > user.artisanProfile.proExpiresAt
    ) {
      // It's expired! Downgrade them silently before sending the response
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
// This can be used if they are logged in (via protect) or via email if they aren't
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isEmailVerified)
      return res.status(400).json({ msg: "Email already verified" });

    // Generate fresh OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(
      user.email,
      "Your New Verification Code - Abeg Fix",
      welcomeTemplate(user.firstName, otp, user.role),
    );

    res.json({ msg: "A new verification code has been sent to your email." });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.put("/update-profile", protect, authorize("artisan"), updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword); // Notice the :token param
// @desc    Delete image from Cloudinary and MongoDB
router.put("/delete-portfolio-image", protect, async (req, res) => {
  const { imageUrl } = req.body;
  const userId = req.user.id; // Assuming you have auth middleware

  try {
    // 1. Extract Public ID from the URL using Regex
    // This finds everything between the version number (v12345/) and the file extension (.jpg)
    const regex = /\/v\d+\/(.+)\./;
    const match = imageUrl.match(regex);
    const publicId = match ? match[1] : null;

    if (publicId) {
      // 2. Delete from Cloudinary
      await cloudinary.uploader.destroy(publicId);
    }

    // 3. Remove from MongoDB using $pull
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
  // Destructure exactly what the frontend is sending in the 'profile' state
  const { firstName, lastName, phoneNumber } = req.body;

  try {
    // Build the update object using dot notation for nested fields
    const updateFields = {};

    if (firstName !== undefined) updateFields.firstName = firstName.trim();
    if (lastName !== undefined) updateFields.lastName = lastName.trim();

    // This matches the phoneNumber field inside your customerProfile schema
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

export default router;
