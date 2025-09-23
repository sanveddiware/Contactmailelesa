// mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter using Gmail and App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // App Password, NOT normal Gmail password
  },
});

// Verify transporter
transporter.verify()
  .then(() => console.log("✅ Mail transporter ready"))
  .catch((err) => console.error("⚠️ Mail transporter failed:", err));

// Send thank-you email
export default async function sendThankYouEmail(to, name, event) {
  const mailOptions = {
    from: `"ELESA Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Thank you for registering 🎉",
    html: `
      <h2>Hi ${name},</h2>
      <p>✅ Thank you for registering for <strong>${event}</strong>!</p>
      <p>We have received your details successfully. Further information will be shared with you soon.</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>Team ELESA</strong></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📩 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
}
