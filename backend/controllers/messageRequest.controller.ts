import { Request, Response, NextFunction } from "express";
import { MessageRequest } from "../models/messageRequest.model";
import { User } from "../models/user.model";
import { Message } from "../models/message.model";
import { Conversation } from "../models/conversation.model";
import { Contact } from "../models/contact.model";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/groupMember.model";
import { apiSuccess } from "../utils/apiResponse";
import { NotFoundError } from "../utils/apiError";
import { MessageType } from "../types/enums";
import {
  emitToUser,
  createAndEmitNotification,
} from "../services/notification.service";
import mongoose from "mongoose";

const createGroupSystemMessage = async (
  conversationId: mongoose.Types.ObjectId,
  senderUserId: mongoose.Types.ObjectId,
  content: string
) => {
  const message = await Message.create({
    conversationId,
    senderId: senderUserId,
    type: MessageType.SYSTEM,
    content,
    readBy: [senderUserId],
    readByAt: { [senderUserId.toString()]: new Date() },
    unsent: false,
  });

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessage: {
          content,
          senderId: senderUserId,
          type: MessageType.SYSTEM,
          timestamp: message.createdAt,
        },
        updatedAt: new Date(),
      },
    }
  );

  const [sender, conversation] = await Promise.all([
    User.findById(senderUserId).select("username profileImage").lean(),
    Conversation.findById(conversationId).select("participants").lean(),
  ]);

  const payload = {
    messageId: message._id.toString(),
    conversationId: conversationId.toString(),
    senderId: senderUserId.toString(),
    senderUsername: sender?.username ?? "System",
    senderProfileImage: sender?.profileImage ?? null,
    type: MessageType.SYSTEM,
    content,
    mediaUrl: null,
    fileName: null,
    fileSize: null,
    timestamp: message.createdAt.toISOString(),
  };

  for (const participantId of conversation?.participants ?? []) {
    emitToUser(participantId.toString(), "message:receive", payload);
  }
};

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
      .populate("fromUserId", "anonimiId username profileImage")
      .populate("conversationId")
      .populate("groupId", "name image")
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      requests.map(async (r: any) => {
        const lastMessage = await Message.findOne({ conversationId: r.conversationId._id })
          .sort({ createdAt: -1 })
          .lean();

        const fromUser = r.fromUserId ?? null;
        const fallbackFromUserId = r.fromUserId?.toString?.() ?? "";
        const group = r.groupId ?? null;

        return {
          id: r._id.toString(),
          conversationId: r.conversationId._id.toString(),
          type: group ? "group" : "private",
          from: fromUser
            ? {
                id: fromUser._id.toString(),
                anonimiId: fromUser.anonimiId,
                username: fromUser.username,
                profileImage: fromUser.profileImage,
                isDeleted: false,
              }
            : {
                id: fallbackFromUserId,
                anonimiId: "deleted",
                username: "Deleted temporary user",
                profileImage: null,
                isDeleted: true,
              },
          group: group
            ? {
                id: group._id.toString(),
                name: group.name,
                image: group.image ?? null,
              }
            : null,
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
    const addToContacts = req.body?.addToContacts === true;

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

    const group = request.groupId ? await Group.findById(request.groupId).select("conversationId") : null;

    if (group) {
      const accepter = await User.findById(req.user!._id).select("username").lean();
      const existingMember = await GroupMember.findOne({
        groupId: request.groupId,
        userId: req.user!._id,
      });

      if (!existingMember) {
        await GroupMember.create({
          groupId: request.groupId,
          userId: req.user!._id,
          role: "member",
          joinedVia: "manual_add",
          addedByUserId: request.fromUserId,
          joinedAt: new Date(),
        });
      }

      await Conversation.updateOne(
        { _id: group.conversationId },
        { $addToSet: { participants: req.user!._id } }
      );

      await createGroupSystemMessage(
        group.conversationId,
        req.user!._id,
        `${accepter?.username ?? "A user"} accepted the group invite.`
      );

      apiSuccess(res, {
        message: "Message request accepted.",
        conversationId: request.conversationId.toString(),
        contactAdded: false,
      });
      return;
    }

    if (addToContacts) {
      await Contact.findOneAndUpdate(
        {
          userId: request.fromUserId,
          contactId: req.user!._id,
        },
        {
          status: "accepted",
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      await Contact.findOneAndUpdate(
        {
          userId: req.user!._id,
          contactId: request.fromUserId,
        },
        {
          status: "accepted",
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    } else {
      // Keep a pending contact request so recipient can decide contact action later.
      await Contact.findOneAndUpdate(
        {
          userId: request.fromUserId,
          contactId: req.user!._id,
        },
        {
          status: "pending",
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    const newRequestStatus = addToContacts ? null : "accepted";
    await Conversation.findByIdAndUpdate(request.conversationId, {
      requestStatus: newRequestStatus,
    });

    // Notify original sender that their request was accepted
    const accepter = await User.findById(req.user!._id).select(
      "anonimiId username profileImage"
    );
    emitToUser(request.fromUserId.toString(), "message-request:accepted", {
      requestId: request._id.toString(),
      conversationId: request.conversationId.toString(),
      acceptedBy: {
        id: req.user!._id.toString(),
        anonimiId: accepter?.anonimiId,
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

    if (request.groupId) {
      const [group, decliner] = await Promise.all([
        Group.findById(request.groupId).select("conversationId"),
        User.findById(req.user!._id).select("username").lean(),
      ]);

      if (group) {
        await createGroupSystemMessage(
          group.conversationId,
          req.user!._id,
          `${decliner?.username ?? "A user"} declined the group invite.`
        );
      }
    }

    apiSuccess(res, { message: "Message request ignored." });
  } catch (error) {
    next(error);
  }
};
