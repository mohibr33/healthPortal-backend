// import { SupportTicket } from "@prisma/client";

export interface ISupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: "open" | "resolved";
  priority: "Low" | "Medium" | "High";
  resolutionNote?: string | null;
  resolvedAt?: Date | null;
  resolvedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateTicketDTO {
  subject: string;
  description: string;
  priority?: "Low" | "Medium" | "High";
}

export interface IResolveTicketDTO {
  resolutionNote: string;
}

export interface ITicketWithUser extends ISupportTicket {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  resolver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}
