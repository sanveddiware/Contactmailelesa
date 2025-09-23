import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// POST /send
router.post("/api/send", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.json({ success: false, error: "All fields are required." });
  }

  try {
    // transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // or SMTP details
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Mail to Admin (You)
    await transporter.sendMail({
      from: `"ELESA Contact Form" <${process.env.MAIL_USER}>`,
      to: process.env.ADMIN_EMAIL, // your email
      subject: `New Query from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `<h3>New Contact Form Submission</h3>
             <p><b>Name:</b> ${name}</p>
             <p><b>Email:</b> ${email}</p>
             <p><b>Message:</b> ${message}</p>`,
    });

    // Acknowledgment Mail to User
    await transporter.sendMail({
      from: `"ELESA Team" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "We received your query ✔",
      text: `Hello ${name},\n\nThank you for your response. We will reach out to your query as soon as possible.\n\n- Team ELESA`,
      html: `<p>Hello <b>${name}</b>,</p>
             <p>✅ Thank you for your response. We will reach out to your query as soon as possible.</p>
             <br/>
             <p>Regards,<br/>Team ELESA</p>`,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return res.json({ success: false, error: "Email not sent." });
  }
});

export default router;
