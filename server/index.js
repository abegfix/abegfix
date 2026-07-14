import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import User from "./models/User.js";

//routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js"; // Don't forget the .js!
import paymentRoutes from "./routes/payments.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import webhookRoutes from "./routes/webhook.js";
import adminRoutes from "./routes/admin.js";
import ticketRoutes from "./routes/tickets.js";

// Cron Jobs
import { initCronJobs } from "./utils/cronJobs.js";

dotenv.config();
const app = express();
app.set("trust proxy", 1); // Crucial for Render/Netlify/Cloudflare

// Middleware
app.use(cors());
app.use(express.json()); // Body parser

// Global limiter: Max 100 requests per 15 mins
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { msg: "Too many requests, please try again later." },
  standardHeaders: true, // Returns RateLimit-Limit headers
  legacyHeaders: false,
});

// Stricter limiter for Auth (Signups/OTP): Max 5 attempts per hour
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { msg: "Too many auth attempts. Please wait an hour." },
});

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("🔥 MongoDB Connected"))
  .catch((err) => console.error("Database connection error:", err));

// Init cron jobs
initCronJobs();

app.use("/api", globalLimiter);
app.get("/", (req, res) => {
  res.send("Abeg Fix API is running...");
});
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);

//Artisan HTML Route
app.get("/artisan/:username", async (req, res) => {
  try {
    const { username } = req.params;


    const artisan = await User.findOne({
      username: username.toLowerCase(),
      role: "artisan",
    }).select(
      "-password -emailVerificationOTP -otpExpires -artisanProfile.nin"
    );

    if (!artisan) {
      return res.status(404).send("Artisan not found");
    }

    const profile = artisan.artisanProfile || {};

    const title = `${profile.businessName || artisan.username} | Abeg Fix`;

    const description =
      `${profile.category || "Professional artisan"} in ${profile.address || "Lagos"}. View portfolio, reviews and contact on Abeg Fix.`;

    const image =
      profile.profilePic ||
      "https://abegfix.com/assets/logo-eaDYfWcH.png";


    const html = `
<!DOCTYPE html>
<html>
<head>

<title>${title}</title>

<meta name="description" content="${description}">

<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:type" content="profile">
<meta property="og:url" content="https://abegfix.com/artisan/${username}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">

</head>

<body>
Loading Abeg Fix...
</body>

</html>
`;

    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Health check (usually left without a limiter so monitoring tools don't get blocked)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
