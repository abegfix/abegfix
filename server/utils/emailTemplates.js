// Replace this with your actual Cloudinary URL
const LOGO_URL =
  "https://res.cloudinary.com/diwz3uvgw/image/upload/v1774534460/RE79T3F_a8s3kh.png";

export const welcomeTemplate = (firstName, otp, role) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #1E3A8A; padding: 40px 20px; text-align: center;">
    <img src="${LOGO_URL}" alt="Abeg Fix" style="width: 150px; height: auto; margin-bottom: 10px;">
    <h1 style="color: white; margin: 0; font-size: 20px; letter-spacing: 4px; font-weight: 900; text-transform: uppercase;">Reliable Artisans</h1>
  </div>

  <div style="padding: 40px 30px; color: #334155; line-height: 1.8;">
    <h2 style="color: #1E3A8A; font-size: 22px; font-weight: 800; margin-top: 0;">Welcome to the family!</h2>
    <p style="font-size: 16px;">Hello <span style="color: #1E3A8A; font-weight: 700;">${firstName}</span>,</p>
    <p>Thank you for joining Abeg Fix as a <b>${role === "artisan" ? "Professional Artisan" : "Customer"}</b>. We're excited to have you on board.</p>

    <p style="margin-bottom: 5px;">To verify your email address, please use this security code:</p>
    <div style="background: #f1f5f9; border: 2px solid #e2e8f0; padding: 25px; text-align: center; margin: 20px 0; border-radius: 20px;">
      <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #1E3A8A; font-family: monospace;">${otp}</span>
    </div>

    <p style="font-size: 13px; color: #64748b; background: #fff7ed; padding: 15px; border-left: 4px solid #f97316; border-radius: 8px;">
      <b>Note:</b> This code expires in 10 minutes. If you didn't create this account, you can safely ignore this message.
    </p>
  </div>

  <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; 2026 Abeg Fix Nigeria. Connecting Lagos to quality service.</p>
  </div>
</div>
`;

export const resetTemplate = (resetUrl) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #1E3A8A; padding: 40px 20px; text-align: center;">
    <img src="${LOGO_URL}" alt="Abeg Fix" style="width: 120px; height: auto;">
  </div>

  <div style="padding: 40px 30px; text-align: center; color: #334155;">
    <h2 style="color: #1E3A8A; font-size: 24px; font-weight: 800;">Password Reset</h2>
    <p style="font-size: 16px; margin-bottom: 30px;">Forgot your password? No worries, it happens to the best of us. Click the button below to set a new one.</p>

    <a href="${resetUrl}" style="background-color: #1E3A8A; color: #ffffff; padding: 18px 35px; text-decoration: none; border-radius: 14px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(30, 58, 138, 0.2);">
      Reset My Password
    </a>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 40px; line-height: 1.5;">
      This link is valid for <b>1 hour</b>.<br/>
      If you didn't request a reset, please secure your account.
    </p>
  </div>

  <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #cbd5e1;">
    Abeg Fix &bull; Reliable Artisans &bull; Lagos, Nigeria
  </div>
</div>
`;

export const supportReplyTemplate = (
  firstName,
  ticketSubject,
  adminMessage,
  ticketId,
) => `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #1E3A8A; padding: 40px 20px; text-align: center;">
    <img src="${LOGO_URL}" alt="Abeg Fix" style="width: 120px; height: auto;">
    <h1 style="color: white; margin: 10px 0 0; font-size: 16px; letter-spacing: 2px; font-weight: 700; text-transform: uppercase;">Support Update</h1>
  </div>

  <div style="padding: 40px 30px; color: #334155; line-height: 1.8;">
    <h2 style="color: #1E3A8A; font-size: 22px; font-weight: 800; margin-top: 0;">New message from Support</h2>
    <p style="font-size: 16px;">Hello <span style="color: #1E3A8A; font-weight: 700;">${firstName}</span>,</p>
    <p>Our team has responded to your ticket regarding: <b>${ticketSubject}</b>.</p>

    <div style="background: #f8fafc; border-left: 4px solid #1E3A8A; padding: 20px; margin: 25px 0; font-style: italic; color: #475569;">
      "${adminMessage}"
    </div>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL}/support/tickets/${ticketId}" style="background-color: #1E3A8A; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block;">
        View Ticket & Reply
      </a>
    </div>
  </div>

  <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; 2026 Abeg Fix Nigeria. Your ticket ID: ${ticketId.toString().toUpperCase()}</p>
  </div>
</div>
`;
