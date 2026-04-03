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
  const fromName = env.SMTP_FROM_NAME || "anonimi";

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

const baseEmailTemplate = (params: {
  title: string;
  body: string;
  actionText?: string;
  actionLink?: string;
  secondaryText?: string;
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; margin-bottom: 24px;">
                <span style="color: white; font-size: 24px; font-weight: 700; letter-spacing: 1px;">ECHO</span>
              </div>
              <h1 style="margin: 0 0 8px; color: #1e293b; font-size: 24px; font-weight: 600;">${params.title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; color: #64748b; font-size: 16px; line-height: 1.6; text-align: center;">
                ${params.body}
              </p>
            </td>
          </tr>
          ${params.actionLink ? `
          <tr>
            <td style="padding: 0 40px 24px; text-align: center;">
              <a href="${params.actionLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 10px; transition: transform 0.2s, box-shadow 0.2s;">
                ${params.actionText}
              </a>
            </td>
          </tr>
          ` : ''}
          ${params.secondaryText ? `
          <tr>
            <td style="padding: 0 40px 24px;">
              <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5; text-align: center;">
                ${params.secondaryText}
              </p>
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                © ${new Date().getFullYear()} EchoID. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const sendVerificationEmail = async (params: {
  to: string;
  code: string;
  link: string;
}): Promise<void> => {
  ensureEmailConfigured();

  const transporter = getTransporter();

  const subject = "Verify your EchoID account";
  const html = baseEmailTemplate({
    title: "Verify your account",
    body: "Use the code below to verify your EchoID account. It expires in 15 minutes.",
    actionText: params.code,
    actionLink: params.link,
    secondaryText: "If you didn't create an account, you can safely ignore this email.",
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

  const subject = "Reset your EchoID password";
  const html = baseEmailTemplate({
    title: "Reset your password",
    body: "We received a request to reset your EchoID password. Click the button below to create a new password.",
    actionText: "Reset Password",
    actionLink: params.link,
    secondaryText: "This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.",
  });

  await transporter.sendMail({
    from: resolveFromAddress(),
    to: params.to,
    subject,
    html,
  });
};
