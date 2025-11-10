const express = require("express");
const router = express.Router();
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const {
  createTicket,
  getAllTickets,
  resolveTicket,
  getMyTickets,
  deleteTicket, // added
} = require("../controllers/supportController");

// 🧾 User Routes
router.post("/", verifyToken, createTicket);
router.get("/my-tickets", verifyToken, getMyTickets);

// 🧾 Admin Routes
router.get("/", verifyToken, verifyAdmin, getAllTickets);
router.put("/:id", verifyToken, verifyAdmin, resolveTicket);
router.delete("/:id", verifyToken, verifyAdmin, deleteTicket); // added

module.exports = router;
