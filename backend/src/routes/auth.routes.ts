import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { authLimiter } from "../middleware/rateLimiter.middleware";
import { uploadSingle } from "../middleware/upload.middleware";
import {
  registerSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
  verifyEmailLinkSchema,
  verificationStatusSchema,
  resendVerificationSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema,
} from "../validators/auth.validator";
import {
  updateProfileSchema,
} from "../validators/user.validator";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail);
router.post("/verify-phone", validate(verifyPhoneSchema), authController.verifyPhone);
router.get("/verify-email-link", validate(verifyEmailLinkSchema), authController.verifyEmailLink);
router.get("/verification-status", validate(verificationStatusSchema), authController.getVerificationStatus);
router.post("/resend-verification", authLimiter, validate(resendVerificationSchema), authController.resendVerification);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh-token", validate(refreshTokenSchema), authController.refreshToken);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
router.post("/logout", authenticate, validate(logoutSchema), authController.logout);

router.get("/me", authenticate, authController.getProfile);
router.patch("/me", authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post("/me/avatar", authenticate, uploadSingle("avatar", "avatar"), authController.updateAvatar);
router.delete("/me/avatar", authenticate, authController.removeAvatar);

export default router;
