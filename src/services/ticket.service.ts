import prisma from "../config/database";
import { ICreateTicketDTO, ITicketWithUser } from "../types/ticket.types";
import { SupportTicket } from "@prisma/client";

class TicketService {
  // Generate a unique ticket number
  private generateTicketNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TKT-${timestamp}-${random}`;
  }

  // Create ticket
  async createTicket(
    ticketData: ICreateTicketDTO,
    userId: string
  ): Promise<ITicketWithUser> {
    const ticketNumber = this.generateTicketNumber();
    
    const ticket = await prisma.supportTicket.create({
      data: {
        ...ticketData,
        ticketNumber,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return ticket;
  }

  // Find ticket by ID
  async findTicketById(id: string): Promise<ITicketWithUser | null> {
    return await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Get user's tickets
  async getUserTickets(
    userId: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ tickets: ITicketWithUser[]; total: number }> {
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where: { userId },
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportTicket.count({ where: { userId } }),
    ]);

    return { tickets, total };
  }

  // Get all tickets (Admin)
  async getAllTickets(
    skip: number = 0,
    take: number = 10,
    status?: "open" | "resolved"
  ): Promise<{ tickets: ITicketWithUser[]; total: number }> {
    const where = status ? { status } : {};

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          resolver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return { tickets, total };
  }

  // Resolve ticket
  async resolveTicket(
    id: string,
    resolutionNote: string,
    adminId: string
  ): Promise<ITicketWithUser> {
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: "resolved",
        resolutionNote,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        resolver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return ticket;
  }

  // Delete ticket
  async deleteTicket(id: string): Promise<SupportTicket> {
    return await prisma.supportTicket.delete({
      where: { id },
    });
  }

  // Get ticket statistics (Admin)
  async getTicketStats(): Promise<{
    total: number;
    open: number;
    resolved: number;
    byPriority: { Low: number; Medium: number; High: number };
  }> {
    const [total, open, resolved, lowPriority, mediumPriority, highPriority] =
      await Promise.all([
        prisma.supportTicket.count(),
        prisma.supportTicket.count({ where: { status: "open" } }),
        prisma.supportTicket.count({ where: { status: "resolved" } }),
        prisma.supportTicket.count({ where: { priority: "Low" } }),
        prisma.supportTicket.count({ where: { priority: "Medium" } }),
        prisma.supportTicket.count({ where: { priority: "High" } }),
      ]);

    return {
      total,
      open,
      resolved,
      byPriority: {
        Low: lowPriority,
        Medium: mediumPriority,
        High: highPriority,
      },
    };
  }
}

export default new TicketService();
