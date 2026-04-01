import nodemailer from "nodemailer";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

const getTransporter = (() => {
  let transporter: nodemailer.Transporter | null = null;

  return () => {
    if (!transporter) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT),
        secure: env.SMTP_SECURE === "true",
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }

    return transporter;
  };
})();

const resolveFromAddress = (): string => {
  const fromEmail = env.SMTP_FROM_EMAIL || env.SMTP_USER;
  const fromName = env.SMTP_FROM_NAME || "EchoID";

  if (!fromEmail) {
    throw new ApiError("Email service is not configured", 500, "EMAIL_NOT_CONFIGURED");
  }

  return `${fromName} <${fromEmail}>`;
};

const ensureEmailConfigured = () => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new ApiError("Email service is not configured", 500, "EMAIL_NOT_CONFIGURED");
  }
};

export const sendVerificationEmail = async (params: {
  to: string;
  code: string;
  link: string;
}): Promise<void> => {
  ensureEmailConfigured();

  const transporter = getTransporter();

  const subject = "Verify your EchoID account";
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2 style="margin: 0 0 12px;">Verify your account</h2>
      <p style="margin: 0 0 16px;">
        Use this code to verify your EchoID account. It expires in 15 minutes.
      </p>
      <div style="font-size: 24px; font-weight: 700; letter-spacing: 4px; margin: 8px 0 20px;">
        ${params.code}
      </div>
      <p style="margin: 0 0 10px;">Or verify instantly using this link:</p>
      <p style="margin: 0 0 20px;">
        <a href="${params.link}" style="color: #2563eb;">Verify account</a>
      </p>
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        If you did not create an account, you can ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: resolveFromAddress(),
    to: params.to,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async (params: {
  to: string;
  link: string;
}): Promise<void> => {
  ensureEmailConfigured();

  const transporter = getTransporter();

  const subject = "Reset your EchoID password";
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2 style="margin: 0 0 12px;">Reset your password</h2>
      <p style="margin: 0 0 16px;">
        We received a request to reset your EchoID password. This link expires in 1 hour.
      </p>
      <p style="margin: 0 0 20px;">
        <a href="${params.link}" style="color: #2563eb;">Reset password</a>
      </p>
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        If you did not request a password reset, you can safely ignore this email.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: resolveFromAddress(),
    to: params.to,
    subject,
    html,
  });
};
