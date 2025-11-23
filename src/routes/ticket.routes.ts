import express, { Router } from "express";
import * as ticketController from "../controllers/ticket.controller";
import { authenticateToken } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { createTicketValidation } from "../middlewares/ticket.validation";

const router: Router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Create ticket
router.post(
  "/",
  createTicketValidation,
  validateRequest,
  ticketController.createTicket
);

// Get user's tickets
router.get("/my-tickets", ticketController.getMyTickets);

// Get ticket by ID
router.get("/:id", ticketController.getTicketById);

export default router;
