import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getMe, updateProfile } from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.js";
import { revealArtisanContact } from "../controllers/userController.js";

const router = express.Router();

// @route   GET api/users/artisans
// @desc    Get all users who are artisans for the Directory
router.get("/artisans", async (req, res) => {
  try {
    const { lat, lng, category } = req.query;
    let pipeline = [];

    // 1. GEOSPATIAL STAGE
    if (lat && lng) {
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          spherical: true,
          key: "artisanProfile.location",
          query: { role: "artisan" },
          distanceMultiplier: 0.001, // Convert meters to km
        },
      });
    } else {
      pipeline.push({ $match: { role: "artisan" } });
    }

    // 2. CATEGORY FILTER
    if (category && category !== "All") {
      pipeline.push({
        $match: { "artisanProfile.category": category },
      });
    }

    pipeline.push({
      $sort: {
        "artisanProfile.isSponsored": -1, // 1st: Sponsored (True first)
        "artisanProfile.subscriptionTier": -1, // 2nd: Pro (p > f alphabetically, so -1 works)
        "artisanProfile.isVerified": -1,
        distance: 1, // 3rd: Nearest (if geoNear was used)
        "artisanProfile.rating": -1, // 4th: Best rated
      },
    });

    // 4. CLEANUP STAGE
    pipeline.push({
      $project: {
        password: 0,
        "artisanProfile.nin": 0,
        emailVerificationOTP: 0,
        otpExpires: 0,
      },
    });

    const artisans = await User.aggregate(pipeline);
    res.json(artisans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   GET api/users/artisan/:id
// @desc    Get a single artisan's public profile by ID
router.get("/artisan/:id", async (req, res) => {
  try {
    // Find the user by the ID passed in the URL
    const artisan = await User.findById(req.params.id).select("-password");

    // Safety check: Ensure the user exists and is actually an artisan
    if (!artisan || artisan.role !== "artisan") {
      return res.status(404).json({ msg: "Artisan not found" });
    }

    res.json(artisan);
  } catch (err) {
    // Check if the error is a malformed MongoDB ObjectId
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Invalid Artisan ID" });
    }
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// GET /api/users/favorites
router.get("/favorites", protect, async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: "favorites",
    select: "artisanProfile", // Only get the business info, not their passwords!
  });
  res.json(user.favorites);
});

// POST /api/users/favorite/:artisanId
router.post("/favorite/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const artisanId = req.params.id;

    // 1. Use .some() and .toString() to reliably check for the ID
    const isFavorited = user.favorites.some(
      (id) => id.toString() === artisanId,
    );

    if (isFavorited) {
      // 2. Remove if it exists
      // .pull() is a Mongoose helper that handles the ObjectId conversion for you
      user.favorites.pull(artisanId);
      await user.save();
      return res.json({
        msg: "Removed from favorites",
        favorites: user.favorites,
      });
    }

    // 3. Add if it doesn't exist
    user.favorites.push(artisanId);
    await user.save();

    res.json({ msg: "Added to favorites", favorites: user.favorites });
  } catch (err) {
    console.error("Favorite Error:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
});

// POST /api/users/reveal/:artisanId
router.post("/reveal-artisan/:artisanId", protect, revealArtisanContact);

export default router;
