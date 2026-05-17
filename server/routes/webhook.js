import express from "express";
import crypto from "crypto";
import User from "../models/User.js";

const router = express.Router();

// PAYSTACK WEBHOOK ENDPOINT
router.post("/paystack", async (req, res) => {
  try {
    // 1. Verify the event signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    // 2. Get the event data
    const event = req.body;

    // 3. Handle 'charge.success'
    if (event.event === "charge.success") {
      const { metadata, customer } = event.data;
      const { userId, upgradeType } = metadata;

      const update =
        upgradeType === "pro"
          ? { "artisanProfile.subscriptionTier": "pro" }
          : { "artisanProfile.isVerified": true };

      await User.findByIdAndUpdate(userId, { $set: update });

      console.log(`Successfully upgraded User ${userId} to ${upgradeType}`);
    }

    // Always send 200 OK to Paystack so they stop retrying
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.sendStatus(500);
  }
});

router.post("/flutterwave", async (req, res) => {
  try {
    // 1. Verify the signature
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH; // Set this in Flutterwave Dashboard
    const signature = req.headers["verif-hash"];

    if (!signature || signature !== secretHash) {
      return res.status(401).send("Unauthorized");
    }

    const event = req.body;

    // 2. Handle 'charge.completed'
    if (event.status === "successful") {
      const { userId, upgradeType } = event.meta; // Passed in the metadata

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      let update = {};
      if (upgradeType === "pro") {
        update = {
          "artisanProfile.subscriptionTier": "pro",
          "artisanProfile.proExpiresAt": expiryDate,
        };
      } else if (upgradeType === "premium") {
        update = {
          "customerProfile.premiumStatus": "premium",
          "customerProfile.premiumExpiresAt": expiryDate,
        };
      } else if (upgradeType === "verified") {
        update = { "artisanProfile.isVerified": true };
      }

      await User.findByIdAndUpdate(userId, { $set: update });
      console.log(`Webhook: Upgraded User ${userId} to ${upgradeType}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Flutterwave Webhook Error:", err.message);
    res.sendStatus(500);
  }
});
router.post("/flutterwave", async (req, res) => {
  try {
    // 1. Verify the signature
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH; // Set this in Flutterwave Dashboard
    const signature = req.headers["verif-hash"];

    if (!signature || signature !== secretHash) {
      return res.status(401).send("Unauthorized");
    }

    const event = req.body;

    // 2. Handle 'charge.completed'
    if (event.status === "successful") {
      const { userId, upgradeType } = event.meta; // Passed in the metadata

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      let update = {};
      if (upgradeType === "pro") {
        update = {
          "artisanProfile.subscriptionTier": "pro",
          "artisanProfile.proExpiresAt": expiryDate,
        };
      } else if (upgradeType === "premium") {
        update = {
          "customerProfile.premiumStatus": "premium",
          "customerProfile.premiumExpiresAt": expiryDate,
        };
      } else if (upgradeType === "verified") {
        update = { "artisanProfile.isVerified": true };
      }

      await User.findByIdAndUpdate(userId, { $set: update });
      console.log(`Webhook: Upgraded User ${userId} to ${upgradeType}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Flutterwave Webhook Error:", err.message);
    res.sendStatus(500);
  }
});

export default router;
