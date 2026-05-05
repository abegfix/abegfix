import Ticket from "../models/Ticket.js";
import axios from "axios";
import { sendEmail } from "../utils/sendEmail.js";
import { supportReplyTemplate } from "../utils/emailTemplates.js";
import AdminLog from "../models/AdminLog.js";
// @desc    Create a new ticket & Notify Slack
export const createTicket = async (req, res) => {
  try {
    const { subject, description, priority } = req.body;

    const ticket = await Ticket.create({
      user: req.user.id,
      subject,
      description,
      priority,
      messages: [{ sender: req.user.id, message: description }],
    });

    if (process.env.SLACK_WEBHOOK_URL) {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `RTX: New Support Ticket! 🎫\n*User:* ${req.user.firstName} ${req.user.lastName}\n*Subject:* ${subject}\n*Message:* ${description}`,
      });
    }

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc    Get all tickets for the logged-in user (Artisan or Customer)
export const getUserTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user.id }).sort("-updatedAt");
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc    Get single ticket thread (Secure)
export const getSingleTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate(
      "user",
      "firstName lastName email",
    );

    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    // Security: Only owner or admin can view
    if (
      ticket.user._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc    User reply back to Admin
export const userReply = async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });
    if (ticket.status === "closed")
      return res.status(400).json({ msg: "Ticket is closed" });

    ticket.messages.push({ sender: req.user.id, message });
    ticket.status = "open";
    await ticket.save();

    // Only notify Slack if a non-admin (user) is replying
    if (req.user.role !== "admin" && process.env.SLACK_WEBHOOK_URL) {
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `💬 *User Reply:* ${req.user.firstName} sent a message regarding "${ticket.subject}"`,
      });
    }

    res.status(200).json(ticket);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

// @desc    Admin: Get all tickets in system
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("user", "firstName lastName email")
      .sort("-createdAt");
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};

export const adminReply = async (req, res) => {
  try {
    const { message, status } = req.body;

    // 1. Find and Populate
    const ticket = await Ticket.findById(req.params.id).populate("user");
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    // 2. Save the message immediately
    // Using req.user._id to ensure compatibility with MongoDB IDs
    ticket.messages.push({ sender: req.user._id, message });
    ticket.status = status || "pending";
    await ticket.save();

    // 3. Trigger Audit Log with Fallbacks
    try {
      await AdminLog.create({
        adminId: req.user._id,
        adminName: `${req.user.firstName || "Admin"} ${req.user.lastName || ""}`,
        action: `REPLIED_TO_TICKET: ${ticket.status.toUpperCase()}`,
        targetUserId: ticket.user._id,
        targetUserEmail: ticket.user.email,
      });
      console.log("Admin Log created successfully");
    } catch (logErr) {
      console.error("Failed to create Admin Log:", logErr.message);
      // We don't return res.status(500) here so the user still gets their email
    }

    // 4. Trigger Email Notification
    try {
      const htmlContent = supportReplyTemplate(
        ticket.user.firstName,
        ticket.subject,
        message,
        ticket._id,
      );

      await sendEmail(
        ticket.user.email,
        `Support Update: ${ticket.subject}`,
        htmlContent,
      );
      console.log("Support email sent to:", ticket.user.email);
    } catch (emailErr) {
      console.error("Failed to send support email:", emailErr.message);
    }

    // 5. Final Response
    res.status(200).json(ticket);
  } catch (err) {
    console.error("CRITICAL Admin Reply Error:", err);
    res.status(500).json({ msg: "Server Error", error: err.message });
  }
};

// 3. New Controller to Resolve Tickets
export const resolveTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("user");
    if (!ticket) return res.status(404).json({ msg: "Ticket not found" });

    ticket.status = "resolved";
    await ticket.save();

    // Audit Log for Resolution
    await AdminLog.create({
      adminId: req.user.id,
      adminName: `${req.user.firstName} ${req.user.lastName}`,
      action: "RESOLVED_TICKET",
      targetUserId: ticket.user._id,
      targetUserEmail: ticket.user.email,
    });

    res.status(200).json({ msg: "Ticket marked as resolved", ticket });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
};
