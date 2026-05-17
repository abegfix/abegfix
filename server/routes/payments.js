import express from "express";
import axios from "axios";
import { protect, authorize } from "../middleware/auth.js";
import User from "../models/User.js";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// --- PREMBLY BVN HELPER (v1 API) ---
const verifyBVNWithPrembly = async (bvn) => {
  const url = "https://api.prembly.com/verification/bvn";

  try {
    const response = await axios.post(
      url,
      { number: bvn.toString() },
      {
        headers: {
          "x-api-key": process.env.PREMBLY_SECRET_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );
    if (response.data.status && response.data.response_code === "00") {
      return response.data.data;
    } else {
      throw new Error(response.data.detail || "BVN validation failed");
    }
  } catch (error) {
    console.error("Prembly API Error:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || "Identity service unavailable",
    );
  }
};

const bvnLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many BVN verification attempts. Please try again later.",
});

router.post(
  "/verify-bvn-only",
  protect,
  bvnLimit,
  authorize("artisan"),
  async (req, res) => {
    const { bvn } = req.body;

    if (!bvn || bvn.length !== 11) {
      return res
        .status(400)
        .json({ msg: "Please enter a valid 11-digit BVN." });
    }

    try {
      const bvnData = await verifyBVNWithPrembly(bvn);

      const normalize = (phone) => {
        if (!phone) return "";
        return phone.toString().replace(/\D/g, "").slice(-10);
      };

      const bvnFirst = (bvnData.firstName || bvnData.first_name || "")
        .toLowerCase()
        .trim();
      const bvnLast = (bvnData.lastName || bvnData.last_name || "")
        .toLowerCase()
        .trim();
      const bvnPhone = normalize(
        bvnData.phoneNumber1 ||
          bvnData.phoneNumber ||
          bvnData.phone_number ||
          "",
      );

      const accountFirst = req.user.firstName.toLowerCase().trim();
      const accountLast = req.user.lastName.toLowerCase().trim();
      const accountPhone = normalize(req.user.artisanProfile?.whatsapp || "");

      // 1. Strict Name Check (Non-negotiable)
      const firstNameMatch =
        bvnFirst.includes(accountFirst) || accountFirst.includes(bvnFirst);
      const lastNameMatch =
        bvnLast.includes(accountLast) || accountLast.includes(bvnLast);

      if (!firstNameMatch || !lastNameMatch) {
        return res.status(400).json({
          msg: `Name Mismatch! Your profile name does not match the names linked to this BVN.`,
        });
      }

      // 2. Soft Phone Check (The "Forgiving" Part)
      const phoneMatches = bvnPhone && accountPhone === bvnPhone;

      if (!phoneMatches) {
        // We let them pass anyway because the names matched perfectly!
        return res.status(200).json({
          msg: "Identity confirmed! Proceed to payment.",
          phoneWarning: true,
          bvnPhone: bvnPhone, // Great for showing the user what number is on file
        });
      }

      // 3. Perfect Match
      // (Keep this clean and isolated!)
      return res.status(200).json({
        msg: "Identity & Phone confirmed! Proceed to payment.",
        phoneWarning: false,
      });
    } catch (err) {
      console.error("BVN Verification Error:", err.message);

      if (err.response) {
        const externalStatus = err.response.status;
        const externalMsg =
          err.response.data?.detail || "Identity service is temporarily down.";

        return res.status(externalStatus).json({
          msg: externalMsg,
          isProviderError: externalStatus >= 500,
        });
      }

      res
        .status(500)
        .json({ msg: "An internal error occurred. Please try again." });
    }
  },
);

// --- MAIN PAYMENT VERIFICATION ROUTE ---
// Removed authorize("artisan") so Customers can upgrade to Premium too
router.post("/", protect, async (req, res) => {
  // 1. Destructure everything we need
  const { transaction_id, type, firstName, lastName } = req.body;

  if (!transaction_id) {
    return res.status(400).json({ msg: "No transaction ID provided" });
  }

  try {
    // 2. Flutterwave Verification
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      },
    );

    const paymentData = response.data.data;

    if (paymentData.status !== "successful") {
      return res.status(400).json({ msg: "Payment verification failed" });
    }

    let update = {};
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // 3. THE LOGIC BRANCHES

    // --- ARTISAN PRO ---
    if (type === "pro") {
      update = {
        "artisanProfile.subscriptionTier": "pro",
        "artisanProfile.proExpiresAt": expiryDate,
      };
    }

    // --- IDENTITY VERIFICATION (The missing block) ---
    else if (type === "verified") {
      if (firstName && lastName) {
        const isMatch =
          req.user.firstName.toLowerCase().trim() ===
            firstName.toLowerCase().trim() &&
          req.user.lastName.toLowerCase().trim() ===
            lastName.toLowerCase().trim();

        if (!isMatch) {
          return res.status(400).json({
            msg: "Identity verification failed. Name mismatch with profile.",
          });
        }
      }
      update = { "artisanProfile.isVerified": true };
    }

    // --- CUSTOMER PREMIUM ---
    else if (type === "premium") {
      if (req.user.role !== "customer") {
        return res
          .status(403)
          .json({ msg: "Only customers can upgrade to premium." });
      }
      update = {
        "customerProfile.premiumStatus": "premium",
        "customerProfile.premiumExpiresAt": expiryDate,
      };
    }

    // 4. Execute Update
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true },
    ).select("-password");

    return res.json({
      msg: `Successfully upgraded to ${type}!`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Verification Error:", err.response?.data || err.message);
    res.status(500).json({ msg: "Server Error" });
  }
});

export default router;
