import User from "../models/User.js";

export const revealArtisanContact = async (req, res) => {
  try {
    const userId = req.user.id;
    const { artisanId } = req.params;

    const user = await User.findById(userId);
    const artisan = await User.findById(artisanId);

    if (!artisan || artisan.role !== "artisan") {
      return res.status(404).json({ msg: "Artisan not found." });
    }

    const now = new Date();
    const customer = user.customerProfile;

    // --- 1. PREMIUM CHECK ---
    const isPremium =
      customer.premiumStatus === "premium" && customer.premiumExpiresAt > now;

    // --- 2. UNIQUE REVEAL CHECK (Don't charge twice for same person) ---
    // Initialize array if it doesn't exist
    if (!customer.revealedArtisansToday) customer.revealedArtisansToday = [];

    // Reset list and count if it's a new day
    const lastReveal = customer.lastRevealDate
      ? new Date(customer.lastRevealDate)
      : new Date(0);
    if (lastReveal.toDateString() !== now.toDateString()) {
      customer.freeRevealsCount = 0;
      customer.revealedArtisansToday = [];
    }

    // If already revealed today, just return the number without incrementing
    if (customer.revealedArtisansToday.includes(artisanId) || isPremium) {
      return res.status(200).json({
        whatsapp: artisan.artisanProfile.whatsapp,
        isPremium: isPremium,
      });
    }

    // --- 3. LIMIT CHECK ---
    if (customer.freeRevealsCount >= 3) {
      return res
        .status(403)
        .json({ msg: "Daily limit reached.", requiresUpgrade: true });
    }

    // --- 4. INCREMENT & SAVE ---
    customer.freeRevealsCount += 1;
    customer.lastRevealDate = now;
    customer.revealedArtisansToday.push(artisanId);

    // Tell Mongoose to save the nested object
    user.markModified("customerProfile");
    await user.save();

    return res.status(200).json({
      whatsapp: artisan.artisanProfile.whatsapp,
      revealsLeft: 3 - customer.freeRevealsCount,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
};
