// app.js
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

// Basic middleware
app.use(cors({
  origin: "https://elesa-website-qvwv24d8v-sanved-diwares-projects.vercel.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));

app.options("*", cors({
  origin: "https://elesa-website-qvwv24d8v-sanved-diwares-projects.vercel.app",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));


app.use(express.json());

// Create transporter function so it can use either Gmail (prod) or Ethereal (dev)
async function createTransporter() {
  // If you want to use Ethereal for testing, set USE_ETHEREAL=true in .env
  if (process.env.USE_ETHEREAL === "true") {
    // Create test account (Ethereal)
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  // Production: Gmail (using App Password)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in .env for non-ethereal mode.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// Pre-create transporter at startup (and verify)
let transporter;
createTransporter()
  .then(t => {
    transporter = t;
    // verify transporter config
    transporter.verify()
      .then(() => console.log("✅ Mail transporter ready"))
      .catch(err => console.warn("⚠️ Mail transporter verification failed:", err.message));
  })
  .catch(err => {
    console.error("Failed to create transporter:", err);
    process.exit(1);
  });

// Simple helper to validate email-like string (basic)
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /send - accepts { name, email, message }
app.post("/api/send", async (req, res) => {
  const { name, email, message } = req.body ?? {};

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, msg: "name, email and message are required." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, msg: "Invalid email address." });
  }

  // Compose email
  const mailOptions = {
    from: `"${name}" <${email}>`,              // shown as sender
    to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER, // receiver
    subject: `New message from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
           <p><strong>Email:</strong> ${escapeHtml(email)}</p>
           <p><strong>Message:</strong></p>
           <p>${nl2br(escapeHtml(message))}</p>`
  };

  try {
    if (!transporter) {
      return res.status(500).json({ success: false, msg: "Mail transporter not initialized." });
    }

    const info = await transporter.sendMail(mailOptions);

    // If Ethereal, return preview URL so dev can inspect message
    if (process.env.USE_ETHEREAL === "true") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      return res.status(200).json({ success: true, msg: "Email sent (ethereal).", previewUrl });
    }

    return res.status(200).json({ success: true, msg: "Email sent successfully." });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ success: false, msg: "Failed to send email." });
  }
});

// Small helper functions
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

// Healthcheck
app.get("/", (_, res) => res.send("Mail backend running"));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
