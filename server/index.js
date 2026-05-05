import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

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

// Health check (usually left without a limiter so monitoring tools don't get blocked)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
