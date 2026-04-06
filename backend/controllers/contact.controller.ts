import { Request, Response, NextFunction } from "express";
import * as contactService from "../services/contact.service";
import { apiSuccess, apiPaginated } from "../utils/apiResponse";
import { User } from "../models/user.model";
import { createAndEmitNotification, emitToUser } from "../services/notification.service";

export const getContacts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, limit, cursor } = req.query;
    const result = await contactService.getContacts(
      req.user!._id.toString(),
      (status as "accepted" | "pending") || "accepted",
      limit ? parseInt(limit as string) : 50,
      cursor as string
    );
    apiPaginated(res, result.contacts, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit: parseInt(limit as string) || 50,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncomingRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requests = await contactService.getIncomingRequests(req.user!._id.toString());
    apiSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

export const sendContactRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetAnonimiId } = req.body;
    const sender = await User.findById(req.user!._id).select("anonimiId username profileImage");
    const targetUser = await User.findOne({ anonimiId: targetAnonimiId }).select("_id");

    const result = await contactService.sendContactRequest(
      req.user!._id.toString(),
      targetAnonimiId
    );

    if (targetUser && sender) {
      emitToUser(targetUser._id.toString(), "contact:request", {
        requestId: result.requestId,
        from: {
          id: req.user!._id.toString(),
          anonimiId: sender.anonimiId,
          username: sender.username,
          profileImage: sender.profileImage ?? null,
        },
        createdAt: result.createdAt,
      });
    }

    if (targetUser) {
      await createAndEmitNotification({
        userId: targetUser._id.toString(),
        type: "contact_request",
        title: "New contact request",
        body: `${sender?.username ?? "Someone"} sent you a contact request.`,
        data: {
          fromUserId: req.user!._id.toString(),
          fromAnonimiId: sender?.anonimiId,
          href: "/contacts?tab=requests",
        },
      });
    }

    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const cancelOutgoingContactRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { targetAnonimiId } = req.body;

    const result = await contactService.cancelOutgoingContactRequest(
      req.user!._id.toString(),
      targetAnonimiId
    );

    emitToUser(result.targetUserId, "contact:request-cancelled", {
      fromUserId: req.user!._id.toString(),
    });

    apiSuccess(res, { message: result.message });
  } catch (error) {
    next(error);
  }
};

export const acceptContactRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contactId } = req.params;
    const requester = await contactService.getContactRequestOwner(
      req.user!._id.toString(),
      contactId
    );

    const result = await contactService.acceptContactRequest(
      req.user!._id.toString(),
      contactId
    );

    const accepter = await User.findById(req.user!._id).select("username anonimiId profileImage");
    if (requester?.userId) {
      await createAndEmitNotification({
        userId: requester.userId,
        type: "contact_accepted",
        title: "Contact request accepted",
        body: `${accepter?.username ?? "A user"} accepted your contact request.`,
        data: {
          acceptedByUserId: req.user!._id.toString(),
          acceptedByAnonimiId: accepter?.anonimiId,
          href: "/contacts",
        },
      });
      emitToUser(requester.userId, "contact:accepted", {
        contactId: req.user!._id.toString(),
        anonimiId: accepter?.anonimiId ?? "",
        username: accepter?.username ?? "User",
        profileImage: accepter?.profileImage ?? null,
      });
    }

    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const declineContactRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contactId } = req.params;
    const result = await contactService.declineContactRequest(
      req.user!._id.toString(),
      contactId
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const removeContact = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contactId } = req.params;
    await contactService.removeContact(req.user!._id.toString(), contactId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const updateNickname = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contactId } = req.params;
    const { nickname } = req.body;
    const result = await contactService.updateNickname(
      req.user!._id.toString(),
      contactId,
      nickname
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const updateOwnNickname = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { contactId } = req.params;
    const { nickname } = req.body;
    const result = await contactService.updateOwnNickname(
      req.user!._id.toString(),
      contactId,
      nickname
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
