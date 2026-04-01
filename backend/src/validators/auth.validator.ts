import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_.]+$/,
        "Username can only contain letters, numbers, underscores and periods"
      )
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase, lowercase, and number"
      ),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6, "Verification code must be 6 digits"),
  }),
});

export const verifyPhoneSchema = z.object({
  body: z.object({
    phone: z.string(),
    code: z.string().length(6, "Verification code must be 6 digits"),
  }),
});

export const verifyEmailLinkSchema = z.object({
  query: z.object({
    token: z.string().min(1, "Verification token is required"),
    email: z.string().email().optional(),
  }),
});

export const verificationStatusSchema = z.object({
  query: z.object({
    target: z.string().min(1, "Verification target is required"),
    type: z.enum(["email", "phone"]),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    target: z.string().min(1, "Verification target is required"),
    type: z.enum(["email", "phone"]),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Identifier is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase, lowercase, and number"
      ),
  }),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});
