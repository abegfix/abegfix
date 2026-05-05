import express from "express";
import Ticket from "../models/Ticket.js";
import { protect, authorize } from "../middleware/auth.js";
import {
  createTicket,
  getUserTickets,
  getSingleTicket,
  userReply,
  getAllTickets,
  adminReply,
  resolveTicket,
} from "../controllers/ticketController.js";
const router = express.Router();

router.post("/", protect, createTicket);
router.get("/my-tickets", protect, getUserTickets);
router.get("/:id", protect, getSingleTicket);
router.put("/:id/user-reply", protect, userReply);

// --- ADMIN ROUTES ---
router.get("/admin/all", protect, authorize("admin"), getAllTickets);
router.put("/:id/admin-reply", protect, authorize("admin"), adminReply);
router.put("/:id/resolve", protect, authorize("admin"), resolveTicket);

export default router;
