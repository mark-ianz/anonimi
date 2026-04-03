import nodemailer from "nodemailer";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import ejs from "ejs";
import path from "node:path";

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
  const fromName = env.SMTP_FROM_NAME || "anonimi";

  if (!fromEmail) {
    throw new ApiError(
      "Email service is not configured",
      500,
      "EMAIL_NOT_CONFIGURED",
    );
  }

  return `${fromName} <${fromEmail}>`;
};

const ensureEmailConfigured = () => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    throw new ApiError(
      "Email service is not configured",
      500,
      "EMAIL_NOT_CONFIGURED",
    );
  }
};

const templatePath = path.join(
  __dirname,
  "..",
  "templates",
  "email-template.ejs",
);

export const sendVerificationEmail = async (params: {
  to: string;
  code: string;
  link: string;
}): Promise<void> => {
  ensureEmailConfigured();

  const transporter = getTransporter();

  const subject = "Verify your account";
  const html = await ejs.renderFile(templatePath, {
    type: "verification-code",
    code: params.code,
    logoUrl: "https://i.ibb.co/YF54g82z/anonimi-logo-no-bg.png",
    actionUrl: params.link,
  });

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

  const subject = "Reset Password";
  const html = await ejs.renderFile(templatePath, {
    type: "password-reset",
    logoUrl: "https://i.ibb.co/YF54g82z/anonimi-logo-no-bg.png",
    actionUrl: params.link,
  });

  await transporter.sendMail({
    from: resolveFromAddress(),
    to: params.to,
    subject,
    html,
  });
};
