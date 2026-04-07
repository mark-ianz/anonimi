// email.service.ts
import nodemailer from "nodemailer";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import ejs from "ejs";
import path from "node:path";
import { Resend } from "resend";

// --------------------
// Helper: Paths & Templates
// --------------------
const templatePath = path.join(__dirname, "..", "templates", "email-template.ejs");
const logoUrl = "https://www.anonimi.cloud/images/icon/anonimi-logo-no-bg.png"

// --------------------
// Helper: Resolve sender
// --------------------
const resolveFromAddress = (): string => {
  const fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER || env.RESEND_FROM_EMAIL;
  const fromName = env.SMTP_FROM_NAME || "anonimi";

  if (!fromEmail) {
    throw new ApiError(
      "Email service is not configured",
      500,
      "EMAIL_NOT_CONFIGURED"
    );
  }

  return `${fromName} <${fromEmail}>`;
};

// --------------------
// Helper: Ensure SMTP is configured (for dev)
// --------------------
const ensureSmtpConfigured = () => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new ApiError(
      "SMTP email service is not configured",
      500,
      "EMAIL_NOT_CONFIGURED"
    );
  }
};

// --------------------
// Dynamic Transporter
// --------------------
let smtpTransporter: nodemailer.Transporter | null = null;
const getSmtpTransporter = () => {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: Number(env.SMTP_PORT),
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return smtpTransporter;
};

// --------------------
// Resend Client
// --------------------
const resendClient = env.EMAIL_PROVIDER === "RESEND" ? new Resend(env.RESEND_API_KEY) : null;

// --------------------
// Send Email (dynamic)
// --------------------
const sendEmail = async (params: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (env.EMAIL_PROVIDER === "SMTP") {
    ensureSmtpConfigured();
    const transporter = getSmtpTransporter();
    await transporter.sendMail({
      from: resolveFromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  } else if (env.EMAIL_PROVIDER === "RESEND") {
    if (!resendClient) throw new ApiError("Resend client not initialized", 500);
    const { error } = await resendClient.emails.send({
      from: resolveFromAddress(),
      to: [params.to],
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("Resend email error:", error);
      throw new ApiError("Failed to send email via Resend", 500);
    }
  } else {
    throw new ApiError("No email provider configured", 500);
  }
};

// --------------------
// Exported Email Functions
// --------------------
export const sendVerificationEmail = async (params: {
  to: string;
  code: string;
  link: string;
}): Promise<void> => {
  const html = await ejs.renderFile(templatePath, {
    type: "verification-code",
    code: params.code,
    logoUrl,
    actionUrl: params.link,
  });

  await sendEmail({
    to: params.to,
    subject: "Verify your account",
    html,
  });
};

export const sendPasswordResetEmail = async (params: {
  to: string;
  link: string;
}): Promise<void> => {
  const html = await ejs.renderFile(templatePath, {
    type: "password-reset",
    logoUrl,
    actionUrl: params.link,
  });

  await sendEmail({
    to: params.to,
    subject: "Reset Password",
    html,
  });
};