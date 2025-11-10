const SupportTicket = require("../models/supportTicket");
const sendEmail = require("../utils/sendemail");
const User = require("../models/user");  

// 🧾 Create Ticket (User)
exports.createTicket = async (req, res) => {
  try {
    const { subject, description, Priority } = req.body;

    if (!subject || !description || !Priority) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const ticket = new SupportTicket({
      userId: req.user._id,
      subject,
      description,
      Priority,
    });

    await ticket.save();

    // 📧 Email to User
    await sendEmail(
      req.user.email,
      "Support Ticket Received",
      `Dear ${req.user.firstName},
       Your complaint titled "${subject}" has been received.
       Our team will get back to you shortly. Thank you for contacting support.`
    );

    // 🧑‍💼 Fetch ALL admins (based on your DB structure)
    const admins = await User.find({ role: "admin" });

    // 📧 Email every admin
    for (const admin of admins) {
      await sendEmail(
        admin.email,
        "New Support Ticket Created",
        `A new support ticket has been submitted:

User: ${req.user.firstName} ${req.user.lastName} (${req.user.email})
Subject: ${subject}
Priority: ${Priority}

Please log in to the dashboard to review and respond.`
      );
    }

    res.status(201).json({ message: "Support ticket created successfully.", ticket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// 🧾 Get All Tickets (Admin)
exports.getAllTickets = async (req, res) => {
  try {
    // Accept optional query params: ?priority=high&status=closed
    const { priority, status } = req.query;

    const filter = {};
    if (priority) {
      // Match priority case-insensitively (field stored as 'Priority')
      filter.Priority = { $regex: `^${priority}$`, $options: "i" };
    }
    if (status) {
      // Match status case-insensitively
      filter.status = { $regex: `^${status}$`, $options: "i" };
    }

    const tickets = await SupportTicket.find(filter)
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🧾 Get My Tickets (User)
exports.getMyTickets = async (req, res) => {
  try {
    // Accept optional query params: ?priority=high&status=closed
    const { priority, status } = req.query;

    const filter = { userId: req.user._id };
    if (priority) {
      filter.Priority = { $regex: `^${priority}$`, $options: "i" };
    }
    if (status) {
      filter.status = { $regex: `^${status}$`, $options: "i" };
    }

    const tickets = await SupportTicket.find(filter)
      .populate("userId", "email firstName lastName")
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error("Error fetching user's tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🧾 Resolve Ticket (Admin)
exports.resolveTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { customMessage } = req.body;

    const ticket = await SupportTicket.findById(id).populate("userId", "email firstName");

    if (!ticket) return res.status(404).json({ message: "Ticket not found." });
    if (!customMessage || !customMessage.trim()) {
      return res.status(400).json({ message: "Custom message is required." });
    }

    ticket.status = "resolved";
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = req.user._id;

    await ticket.save();

    await sendEmail(ticket.userId.email, "Issue Resolved", customMessage);

    res.json({ message: "Ticket resolved and email sent successfully." });
  } catch (error) {
    console.error("Error resolving ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🗑️ Delete Ticket
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });

    // Use model deletion method instead of ticket.remove()
    await SupportTicket.findByIdAndDelete(id);

    res.json({ message: "Ticket deleted successfully." });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
