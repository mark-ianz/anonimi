import { Types } from "mongoose";
import { SupportTicket } from "../models/supportTicket.model";
import { SupportMessage } from "../models/supportMessage.model";
import { NotFoundError } from "../utils/apiError";

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
    content: message,
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
      assignedTo: ticket.assignedTo?.toString(),
    },
    messages: messages.map((m: any) => ({
      id: m._id.toString(),
      senderId: m.senderId.toString(),
      senderRole: m.senderRole,
      content: m.content,
      createdAt: m.createdAt,
    })),
  };
};

export const replyToTicket = async (
  ticketId: string,
  userId: string,
  content: string
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
    content,
  });

  ticket.status = "waiting_on_user";
  await ticket.save();

  return {
    messageId: message._id.toString(),
    content: message.content,
    senderRole: message.senderRole,
    createdAt: message.createdAt,
  };
};
