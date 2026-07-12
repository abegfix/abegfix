import mongoose from "mongoose";

const { Schema, model } = mongoose;

const portfolioLimit = function (val) {
  // 'this' refers to the user document being saved
  const tier = this.artisanProfile?.subscriptionTier || "free";
  const limit = tier === "pro" ? 15 : 3;
  return val.length <= limit;
};
const UserSchema = new Schema(
  {
    // Global fields (for everyone)
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: {
      type: String,
      unique: true,
      sparse: true, // Crucial: allows customers who don't have a username yet to avoid null duplicate errors
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9_]+$/,
        "Usernames can only contain letters, numbers, and underscores.",
      ],
    },
    role: {
      type: String,
      enum: ["customer", "artisan", "admin"],
      default: "customer",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationOTP: String,
    otpExpires: Date,

    // Password Reset fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // --- ADDED: Customer Specific Fields ---
    customerProfile: {
      lga: String,
      phoneNumber: { type: String, required: false },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          required: false, // Remove default: "Point"
        },
        coordinates: {
          type: [Number],
          required: false,
        },
      },
      premiumStatus: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
      },
      premiumExpiresAt: Date,
      freeRevealsCount: {
        type: Number,
        default: 0,
      },
      lastRevealDate: Date,
      revealedArtisansToday: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      ],
    },

    // Password Reset fields (Top level so both roles can use them)
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Artisan specific fields
    artisanProfile: {
      businessName: String,
      category: String,
      whatsapp: {
        type: String,
        set: (val) => {
          // If no value is provided (like for a customer), return null or undefined
          if (!val) return undefined;

          let cleaned = val.replace(/\D/g, "");
          if (cleaned.startsWith("0")) {
            cleaned = "234" + cleaned.substring(1);
          }
          if (cleaned.length === 10) {
            cleaned = "234" + cleaned;
          }
          return cleaned;
        },
      },
      bio: String,
      profilePic: String,
      address: String, // The readable text
      location: {
        type: {
          type: String,
          enum: ["Point"],
          required: false, // Remove default: "Point"
        },
        coordinates: {
          type: [Number],
          required: false,
        },
      },
      portfolio: {
        type: [String],
        validate: [
          portfolioLimit,
          "Upgrade to Pro to upload more than 3 portfolio images!",
        ],
      },
      isVerified: { type: Boolean, default: false },
      rating: { type: Number, default: 0 },
      subscriptionTier: {
        type: String,
        enum: ["free", "pro"],
        default: "free",
      },
      proExpiresAt: {
        // <-- ADD THIS
        type: Date,
        default: null,
      },
      isSponsored: { type: Boolean, default: false },
    },

    // Favorites: Array of Artisan IDs
    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
); // Good for tracking when accounts were created

UserSchema.index({ "artisanProfile.location": "2dsphere" });
UserSchema.index({ "customerProfile.location": "2dsphere" });

export default model("User", UserSchema);
