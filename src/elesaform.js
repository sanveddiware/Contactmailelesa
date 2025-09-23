import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ success: false, error: "Invalid JSON" });
  }

  const { name, email, message } = body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, error: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Mail to Admin
    await transporter.sendMail({
      from: `"ELESA Contact Form" <${process.env.MAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Query from ${name}`,
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
      html: `<p>Hello <b>${name}</b>,</p>
             <p>✅ Thank you for your response. We will reach out to your query as soon as possible.</p>
             <br/>
             <p>Regards,<br/>Team ELESA</p>`,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ success: false, error: "Email not sent" });
  }
}
