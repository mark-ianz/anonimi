import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import { uploadFileToCloudinary } from "../services/cloudinary.service";
import { apiSuccess, apiError } from "../utils/apiResponse";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, username, password } = req.body;
    const result = await authService.register(email, username, password);
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

export const verifyEmailLink = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query as { token: string };
    const result = await authService.verifyEmailLink(token);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getVerificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const type = req.query.type as "email" | "phone";
    const target = req.query.target as string;
    const result = await authService.getVerificationStatus(type, target);
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, target } = req.body as { type: "email" | "phone"; target: string };
    const result = await authService.resendVerificationCode(type, target);
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

export const createTemporaryAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.createTemporaryAccount();
    apiSuccess(res, result, 201);
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
    apiSuccess(res, result);
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

export const claimTemporaryAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.claimTemporaryAccount(
      req.user!._id.toString(),
      email,
      password
    );
    apiSuccess(res, result, 200);
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
      anonimiId: user.anonimiId,
      username: user.username,
      usernameCanEdit: !user.usernameChangedAt && !user.isTemporary,
      email: user.email ?? null,
      phone: user.phone ?? null,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      appearanceStatus: user.appearanceStatus,
      fontStyle: user.fontStyle,
      notificationSoundEnabled: user.notificationSoundEnabled,
      notificationSound: user.notificationSound,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isTemporary: !!user.isTemporary,
      tempExpiresAt: user.tempExpiresAt ?? null,
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
    const {
      username,
      phone,
      appearanceStatus,
      fontStyle,
      notificationSoundEnabled,
      notificationSound,
    } = req.body;
    const user = await authService.updateProfile(req.user!._id.toString(), {
      username,
      phone,
      appearanceStatus,
      fontStyle,
      notificationSoundEnabled,
      notificationSound,
    });
    apiSuccess(res, {
      id: user._id.toString(),
      anonimiId: user.anonimiId,
      username: user.username,
      usernameCanEdit: !user.usernameChangedAt && !user.isTemporary,
      email: user.email ?? null,
      phone: user.phone ?? null,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      appearanceStatus: user.appearanceStatus,
      fontStyle: user.fontStyle,
      notificationSoundEnabled: user.notificationSoundEnabled,
      notificationSound: user.notificationSound,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      isTemporary: !!user.isTemporary,
      tempExpiresAt: user.tempExpiresAt ?? null,
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
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: "NO_FILE", message: "No file uploaded" },
      });
      return;
    }

    const upload = await uploadFileToCloudinary(req.file, "avatar");
    const result = await authService.updateAvatar(
      req.user!._id.toString(),
      upload.url
    );
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const removeAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.removeAvatar(req.user!._id.toString());
    apiSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
