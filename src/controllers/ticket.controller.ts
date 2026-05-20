import { Request, Response, NextFunction } from "express";
import ticketService from "../services/ticket.service";
import emailService from "../utils/email.util";
import { IAuthRequest } from "../types/user.types";

// Create ticket
export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subject, description, category, priority } = req.body;
    const userId = (req as IAuthRequest).userId!;

    // Create ticket
    const ticket = await ticketService.createTicket(
      { subject, description, category, priority },
      userId
    );

    // Send notification emails
    try {
      // Send confirmation to user
      await emailService.sendTicketCreatedUserEmail(
        ticket.user.email,
        ticket.user.firstName,
        ticket.id,
        ticket.subject
      );

      // Send notification to admin
      await emailService.sendTicketCreatedAdminEmail(
        ticket.id,
        ticket.user.email,
        ticket.subject,
        ticket.priority
      );
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's tickets
export const getMyTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as IAuthRequest).userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { tickets, total } = await ticketService.getUserTickets(
      userId,
      skip,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get ticket by ID (user can only view their own tickets)
export const getTicketById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as IAuthRequest).userId!;

    const ticket = await ticketService.findTicketById(id);

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
      return;
    }

    // Check if ticket belongs to user
    if (ticket.userId !== userId) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to view this ticket",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// Get all tickets (Admin)
export const getAllTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as "open" | "resolved" | undefined;
    const skip = (page - 1) * limit;

    const { tickets, total } = await ticketService.getAllTickets(
      skip,
      limit,
      status
    );

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get ticket by ID (Admin)
export const getTicketByIdAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const ticket = await ticketService.findTicketById(id);

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// Resolve ticket (Admin)
export const resolveTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { resolutionNote } = req.body;
    const adminId = (req as IAuthRequest).userId!;

    // Check if ticket exists
    const existingTicket = await ticketService.findTicketById(id);
    if (!existingTicket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
      return;
    }

    // Check if ticket is already resolved
    if (existingTicket.status === "resolved") {
      res.status(400).json({
        success: false,
        message: "Ticket is already resolved",
      });
      return;
    }

    // Resolve ticket
    const ticket = await ticketService.resolveTicket(
      id,
      resolutionNote,
      adminId
    );

    // Send resolution notification to user
    try {
      await emailService.sendTicketResolvedEmail(
        ticket.user.email,
        ticket.user.firstName,
        ticket.id,
        ticket.subject,
        resolutionNote
      );
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: "Ticket resolved successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

// Delete ticket (Admin)
export const deleteTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if ticket exists
    const ticket = await ticketService.findTicketById(id);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
      return;
    }

    await ticketService.deleteTicket(id);

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get ticket statistics (Admin)
export const getTicketStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await ticketService.getTicketStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
