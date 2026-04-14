// import { Resend } from "resend";
// import dotenv from "dotenv";

// dotenv.config();

// // Initialize with your API Key
// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendEmail = async (to, subject, html) => {
//   try {
//     const { data, error } = await resend.emails.send({
//       from: "Abeg Fix <support@abegfix.com>", // Ensure this matches your verified domain
//       to: [to],
//       subject: subject,
//       html: html,
//     });

//     if (error) {
//       console.error("Resend internal error:", error);
//       throw new Error(error.message);
//     }

//     //console.log("✅ Email sent successfully via Resend API:", data.id);
//     return data;
//   } catch (err) {
//     console.error("Failed to send email through Resend:", err.message);
//     throw err;
//   }
// };

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create the transporter using your QServers SMTP details
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Usually mail.yourdomain.com
  port: 465, // Use 465 for SSL
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Your full QServers email (e.g., support@abegfix.com)
    pass: process.env.EMAIL_PASS, // Your email password
  },
});

export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Abeg Fix" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    });

    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (err) {
    console.error("Nodemailer Error:", err.message);
    throw err;
  }
};
