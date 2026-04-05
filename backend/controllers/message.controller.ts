import { Request, Response, NextFunction } from "express";
import * as chatService from "../services/chat.service";
import { apiSuccess, apiPaginated } from "../utils/apiResponse";

export const createOrGetConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { participantAnonimiId } = req.body;
    const result = await chatService.createOrGetConversation(
      req.user!._id.toString(),
      participantAnonimiId
    );
    apiSuccess(res, result, result.created ? 201 : 200);
  } catch (error) {
    next(error);
  }
};

export const getConversationRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await chatService.getConversationRequests(
      req.user!._id.toString()
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { limit, cursor, filter } = req.query;
    const listFilter = filter === "archived" ? "archived" : "active";
    const result = await chatService.getConversations(
      req.user!._id.toString(),
      limit ? parseInt(limit as string) : 20,
      cursor as string,
      listFilter
    );
    apiPaginated(res, result.conversations, {
      nextCursor: result.nextCursor,
      hasMore: !!result.nextCursor,
      limit: parseInt(limit as string) || 20,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversationId = req.params.conversationId as string;
    const conversation = await chatService.getConversation(
      conversationId,
      req.user!._id.toString()
    );
    apiSuccess(res, conversation);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId, cursor, limit } = req.query;
    const result = await chatService.getMessages(
      conversationId as string,
      req.user!._id.toString(),
      limit ? parseInt(limit as string) : 30,
      cursor as string
    );
    apiPaginated(res, result.messages, {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      limit: result.limit,
    });
  } catch (error) {
    next(error);
  }
};

export const searchMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, cursor, limit } = req.query;
    const result = await chatService.searchMessages(
      req.user!._id.toString(),
      q as string,
      limit ? parseInt(limit as string) : 20,
      cursor as string
    );
    apiPaginated(res, result.messages, {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      limit: result.limit,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId, type, content, mediaUrl, fileName, fileSize, replyToId, stealthDuration, contentCipher, contentIv, contentTag } = req.body;
    const result = await chatService.sendMessage(
      req.user!._id.toString(),
      conversationId,
      type,
      content,
      mediaUrl,
      fileName,
      fileSize,
      { stealthDuration, replyToId, contentCipher, contentIv, contentTag }
    );
    apiSuccess(res, result.message, 201);
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const messageId = req.params.messageId as string;
    const { content, contentCipher, contentIv, contentTag } = req.body;
    const result = await chatService.editMessage(
      messageId,
      req.user!._id.toString(),
      content,
      { contentCipher, contentIv, contentTag }
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteMessageForMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const messageId = req.params.messageId as string;
    const result = await chatService.deleteMessageForMe(
      messageId,
      req.user!._id.toString()
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const unsendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const messageId = req.params.messageId as string;
    const result = await chatService.unsendMessage(
      messageId,
      req.user!._id.toString()
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const markMessagesAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId, messageIds } = req.body;
    await chatService.markMessagesAsRead(
      conversationId,
      messageIds,
      req.user!._id.toString()
    );
    apiSuccess(res, { message: "Messages marked as read" });
  } catch (error) {
    next(error);
  }
};

export const archiveConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversationId = req.params.conversationId as string;
    const result = await chatService.archiveConversation(
      conversationId,
      req.user!._id.toString()
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const unarchiveConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversationId = req.params.conversationId as string;
    const result = await chatService.unarchiveConversation(
      conversationId,
      req.user!._id.toString()
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const muteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { durationMinutes } = req.body ?? {};
    const result = await chatService.muteConversation(
      conversationId,
      req.user!._id.toString(),
      durationMinutes
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const unmuteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const result = await chatService.unmuteConversation(
      conversationId,
      req.user!._id.toString()
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteConversationForMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversationId = req.params.conversationId as string;
    const result = await chatService.deleteConversationForMe(
      conversationId,
      req.user!._id.toString()
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const addMessageReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const messageId = req.params.messageId as string;
    const { emoji } = req.body;
    const result = await chatService.addMessageReaction(
      messageId,
      req.user!._id.toString(),
      emoji
    );
    apiSuccess(res, result, result.action === "removed" ? 200 : 201);
  } catch (error) {
    next(error);
  }
};

export const removeMessageReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const messageId = req.params.messageId as string;
    const reactionId = req.params.reactionId as string;
    const result = await chatService.removeMessageReaction(
      messageId,
      reactionId,
      req.user!._id.toString()
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
