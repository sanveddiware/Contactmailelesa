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
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // Send email to admin (fixed recipient)
    await transporter.sendMail({
      from: `"ELESA Contact Form" <${process.env.EMAIL_USER}>`,
      to:email,       // fixed recipient email
      replyTo: email,                     // sender can reply directly
      subject: `New query from ${name}`,
      html: `<h3>New Contact Form Submission</h3>
             <p><b>Name:</b> ${name}</p>
             <p><b>Email:</b> ${email}</p>
             <p><b>Message:</b> ${message}</p>`,
    });

    // Optional: Acknowledgment to sender
    await transporter.sendMail({
      from: `"ELESA Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "We received your query ✔",
      html: `<p>Hello <b>${name}</b>,</p>
             <p>✅ Thank you for your response. We will reach out to your query as soon as possible.</p>
             <br/>
             <p>Regards,<br/>Team ELESA</p>`,
    });

    return res.status(200).json({ success: true, msg: "Email sent successfully!" });
  } catch (err) {
    console.error("Email send error:", err);
    return res.status(500).json({ success: false, error: "Email not sent" });
  }
}
