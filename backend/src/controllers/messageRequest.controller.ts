import { Request, Response, NextFunction } from "express";
import { MessageRequest } from "../models/messageRequest.model";
import { User } from "../models/user.model";
import { Message } from "../models/message.model";
import { Conversation } from "../models/conversation.model";
import { Contact } from "../models/contact.model";
import { apiSuccess } from "../utils/apiResponse";
import { NotFoundError } from "../utils/apiError";
import {
  emitToUser,
  createAndEmitNotification,
} from "../services/notification.service";
import mongoose from "mongoose";

export const getMessageRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requests = await MessageRequest.find({
      toUserId: req.user!._id,
      status: "pending",
    })
      .populate("fromUserId", "echoId username profileImage")
      .populate("conversationId")
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      requests.map(async (r: any) => {
        const lastMessage = await Message.findOne({ conversationId: r.conversationId._id })
          .sort({ createdAt: -1 })
          .lean();

        return {
          id: r._id.toString(),
          conversationId: r.conversationId._id.toString(),
          from: {
            id: r.fromUserId._id.toString(),
            echoId: r.fromUserId.echoId,
            username: r.fromUserId.username,
            profileImage: r.fromUserId.profileImage,
          },
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                type: lastMessage.type,
                timestamp: lastMessage.createdAt,
              }
            : null,
          status: r.status,
          createdAt: r.createdAt,
        };
      })
    );

    apiSuccess(res, enriched);
  } catch (error) {
    next(error);
  }
};

export const acceptMessageRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { addToContacts } = req.body;

    const request = await MessageRequest.findOne({
      _id: requestId,
      toUserId: req.user!._id,
      status: "pending",
    });

    if (!request) {
      throw new NotFoundError("Message request not found");
    }

    request.status = "accepted";
    await request.save();

    if (addToContacts) {
      await Contact.create({
        userId: req.user!._id,
        contactId: request.fromUserId,
        status: "accepted",
      });

      await Contact.create({
        userId: request.fromUserId,
        contactId: req.user!._id,
        status: "accepted",
      });
    }

    const newRequestStatus = addToContacts ? null : "accepted";
    await Conversation.findByIdAndUpdate(request.conversationId, {
      requestStatus: newRequestStatus,
    });

    // Notify original sender that their request was accepted
    const accepter = await User.findById(req.user!._id).select(
      "echoId username profileImage"
    );
    emitToUser(request.fromUserId.toString(), "message-request:accepted", {
      requestId: request._id.toString(),
      conversationId: request.conversationId.toString(),
      acceptedBy: {
        id: req.user!._id.toString(),
        echoId: accepter?.echoId,
        username: accepter?.username,
        profileImage: accepter?.profileImage ?? null,
      },
      requestStatus: newRequestStatus,
    });

    await createAndEmitNotification({
      userId: request.fromUserId.toString(),
      type: "message_request_accepted",
      title: "Message request accepted",
      body: `${accepter?.username ?? "A user"} accepted your message request.`,
      data: {
        conversationId: request.conversationId.toString(),
        href: `/chat/${request.conversationId.toString()}`,
      },
    });

    apiSuccess(res, {
      message: "Message request accepted.",
      conversationId: request.conversationId.toString(),
      contactAdded: !!addToContacts,
    });
  } catch (error) {
    next(error);
  }
};

export const ignoreMessageRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { requestId } = req.params;

    const request = await MessageRequest.findOneAndUpdate(
      {
        _id: requestId,
        toUserId: req.user!._id,
        status: "pending",
      },
      { status: "ignored" },
      { new: true }
    );

    if (!request) {
      throw new NotFoundError("Message request not found");
    }

    await Conversation.findByIdAndUpdate(request.conversationId, {
      requestStatus: "ignored",
    });

    apiSuccess(res, { message: "Message request ignored." });
  } catch (error) {
    next(error);
  }
};
