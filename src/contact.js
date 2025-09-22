// contact.js
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

let transporter;

// ---- Setup transporter ----
async function createTransporter() {
  if (process.env.USE_ETHEREAL === "true") {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in .env");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// init transporter once
createTransporter().then(t => {
  transporter = t;
  transporter.verify()
    .then(() => console.log("✅ Mail transporter ready"))
    .catch(err => console.warn("⚠️ Mail transporter failed:", err.message));
});

// ---- Helper functions ----
function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function nl2br(str = "") {
  return str.replace(/\r?\n/g, "<br>");
}
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---- Contact form route ----
router.post("/", async (req, res) => {  // ✅ changed from "/send" to "/"
  const { name, email, message } = req.body ?? {};

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, msg: "name, email and message are required." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, msg: "Invalid email address." });
  }

  const ownerMail = {
    from: `"${name}" <${email}>`,
    to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
    subject: `New message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
           <p><strong>Email:</strong> ${escapeHtml(email)}</p>
           <p><strong>Message:</strong></p>
           <p>${nl2br(escapeHtml(message))}</p>`,
  };

  const autoReply = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "We received your message",
    text: `Hello ${name},\n\nThank you for contacting us. We received your message.\n\nYour message:\n${message}\n\nBest regards,\nTeam`,
    html: `<p>Hello <strong>${escapeHtml(name)}</strong>,</p>
           <p>Thank you for contacting us. We received your message and will reach out shortly.</p>
           <hr>
           <p><strong>Your message:</strong></p>
           <p>${nl2br(escapeHtml(message))}</p>
           <p>Best regards,<br>Team</p>`,
  };

  try {
    if (!transporter) {
      return res.status(500).json({ success: false, msg: "Mail transporter not initialized." });
    }

    // 1. Send to site owner
    const info = await transporter.sendMail(ownerMail);

    // 2. Send auto-reply to sender
    await transporter.sendMail(autoReply);

    if (process.env.USE_ETHEREAL === "true") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      return res.status(200).json({
        success: true,
        msg: "Email sent (ethereal). Auto-reply also sent.",
        previewUrl,
      });
    }

    return res.status(200).json({ success: true, msg: "Email sent successfully. Auto-reply sent." });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return res.status(500).json({ success: false, msg: "Failed to send email." });
  }
});

export default router;
