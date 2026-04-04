import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/anonimi"),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  STEALTH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("https://anonimi-messaging.vercel.app0"),
  UPLOAD_DIR: z.string().default("./uploads"),
  DELETE_AVATAR_FILE_ON_REMOVE: z.coerce.boolean().default(false),
  MAX_FILE_SIZE: z.string().default("10485760"),
  FRONTEND_URL: z.string().default("https://anonimi-messaging.vercel.app0"),
  BACKEND_URL: z.string().default("https://anonimi-backend.vercel.app"),
  VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_SUBJECT: z.string().default(""),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.string().default("465"),
  SMTP_SECURE: z.string().default("true"),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM_NAME: z.string().default("anonimi"),
  SMTP_FROM_EMAIL: z.string().default(""),
  EMAIL_VERIFY_URL: z.string().default("https://anonimi-messaging.vercel.app0/verify-link"),
  RESET_PASSWORD_URL: z.string().default("https://anonimi-messaging.vercel.app0/reset-password"),
  RESEND_API_KEY: z.string().default(""),
  EMAIL_PROVIDER: z.enum(["SMTP", "RESEND"]),
  RESEND_FROM_EMAIL: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const getFrontendUrl = () => env.FRONTEND_URL;
