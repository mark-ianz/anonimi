import { Types } from "mongoose";
import { SupportTicket } from "../models/supportTicket.model";
import { SupportMessage } from "../models/supportMessage.model";
import { NotFoundError, ConflictError } from "../utils/apiError";
import { emitToAdmins, emitToUser } from "./notification.service";

export const createTicket = async (
  userId: string,
  subject: string,
  reason: string,
  message: string
) => {
  const ticket = await SupportTicket.create({
    userId: new Types.ObjectId(userId),
    subject,
    reason,
    status: "open",
  });

  await SupportMessage.create({
    ticketId: ticket._id,
    senderId: new Types.ObjectId(userId),
    senderRole: "user",
    type: "text",
    content: message,
  });

  emitToUser(userId, "support:ticket:new", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: ticket.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });
  emitToAdmins("admin:support:ticket:new", {
    ticketId: ticket._id.toString(),
    userId,
    subject,
    reason,
    createdAt: ticket.createdAt,
  });

  return {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    message: "Support ticket created.",
  };
};

export const getTickets = async (userId: string) => {
  const tickets = await SupportTicket.find({ userId: new Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .lean();

  return tickets.map((t: any) => ({
    id: t._id.toString(),
    subject: t.subject,
    reason: t.reason,
    status: t.status,
    assignedTo: null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
};

export const getTicket = async (ticketId: string, userId: string) => {
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  if (ticket.userId.toString() !== userId) {
    throw new NotFoundError("Ticket not found");
  }

  const messages = await SupportMessage.find({ ticketId: ticket._id })
    .sort({ createdAt: 1 })
    .lean();

  return {
    ticket: {
      id: ticket._id.toString(),
      subject: ticket.subject,
      reason: ticket.reason,
      status: ticket.status,
      assignedTo: null,
    },
    messages: messages.map((m: any) => ({
      id: m._id.toString(),
      senderId: m.senderId.toString(),
      senderRole: m.senderRole,
      content: m.content,
      type: m.type ?? "text",
      mediaUrl: m.mediaUrl ?? null,
      createdAt: m.createdAt,
    })),
  };
};

export const replyToTicket = async (
  ticketId: string,
  userId: string,
  content?: string,
  mediaUrl?: string,
  type: "text" | "image" = "text"
) => {
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  if (ticket.userId.toString() !== userId) {
    throw new NotFoundError("Ticket not found");
  }

  const message = await SupportMessage.create({
    ticketId: ticket._id,
    senderId: new Types.ObjectId(userId),
    senderRole: "user",
    type,
    content: content?.trim() || null,
    mediaUrl: mediaUrl ?? null,
  });

  ticket.status = "waiting_on_support";
  await ticket.save();

  const timestamp = ticket.updatedAt?.toISOString?.() ?? new Date().toISOString();
  emitToUser(userId, "support:message:new", {
    ticketId: ticket._id.toString(),
    messageId: message._id.toString(),
    createdAt: message.createdAt,
  });
  emitToAdmins("admin:support:message:new", {
    ticketId: ticket._id.toString(),
    messageId: message._id.toString(),
    userId,
    createdAt: message.createdAt,
  });
  emitToUser(userId, "support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: timestamp,
  });
  emitToAdmins("admin:support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: timestamp,
  });

  return {
    messageId: message._id.toString(),
    content: message.content,
    senderRole: message.senderRole,
    type: message.type,
    mediaUrl: message.mediaUrl ?? null,
    createdAt: message.createdAt,
  };
};

export const reopenTicket = async (ticketId: string, userId: string) => {
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  if (ticket.userId.toString() !== userId) {
    throw new NotFoundError("Ticket not found");
  }

  if (ticket.status !== "resolved" && ticket.status !== "closed") {
    throw new ConflictError("Only resolved or closed tickets can be reopened");
  }

  ticket.status = "open";
  await ticket.save();

  const timestamp = ticket.updatedAt?.toISOString?.() ?? new Date().toISOString();
  emitToUser(userId, "support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: timestamp,
  });
  emitToAdmins("admin:support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: timestamp,
  });

  return { message: "Ticket reopened" };
};
