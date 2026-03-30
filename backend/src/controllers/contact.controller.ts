import { Request, Response, NextFunction } from "express";
import * as contactService from "../services/contact.service";
import { apiSuccess, apiPaginated } from "../utils/apiResponse";
import { User } from "../models/user.model";
import { createAndEmitNotification } from "../services/notification.service";

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
    const { targetEchoId } = req.body;
    const sender = await User.findById(req.user!._id).select("username echoId");
    const targetUser = await User.findOne({ echoId: targetEchoId }).select("_id");

    const result = await contactService.sendContactRequest(
      req.user!._id.toString(),
      targetEchoId
    );

    if (targetUser) {
      await createAndEmitNotification({
        userId: targetUser._id.toString(),
        type: "contact_request",
        title: "New contact request",
        body: `${sender?.username ?? "Someone"} sent you a contact request.`,
        data: {
          fromUserId: req.user!._id.toString(),
          fromEchoId: sender?.echoId,
          href: "/contacts?tab=requests",
        },
      });
    }

    apiSuccess(res, result, 201);
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

    const accepter = await User.findById(req.user!._id).select("username echoId");
    if (requester?.userId) {
      await createAndEmitNotification({
        userId: requester.userId,
        type: "contact_accepted",
        title: "Contact request accepted",
        body: `${accepter?.username ?? "A user"} accepted your contact request.`,
        data: {
          acceptedByUserId: req.user!._id.toString(),
          acceptedByEchoId: accepter?.echoId,
          href: "/contacts",
        },
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
