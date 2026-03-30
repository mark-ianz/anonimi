import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { apiSuccess, apiError } from "../utils/apiResponse";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, username, password } = req.body;
    const result = await authService.register(email, phone, username, password);
    apiSuccess(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyEmail(email, code);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const verifyPhone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, code } = req.body;
    const result = await authService.verifyPhone(phone, code);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    apiSuccess(res, { message: result });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const result = await authService.resetPassword(token, newPassword);
    apiSuccess(res, { message: result });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(req.user!._id.toString(), refreshToken);
    apiSuccess(res, { message: "Logged out successfully." });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await authService.getProfile(req.user!._id.toString());
    apiSuccess(res, {
      id: user._id.toString(),
      echoId: user.echoId,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, phone, appearanceStatus } = req.body;
    const user = await authService.updateProfile(req.user!._id.toString(), {
      username,
      phone,
      appearanceStatus,
    });
    apiSuccess(res, {
      id: user._id.toString(),
      echoId: user.echoId,
      username: user.username,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profileImage = `/uploads/avatars/${req.file?.filename}`;
    const result = await authService.updateAvatar(
      req.user!._id.toString(),
      profileImage
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
