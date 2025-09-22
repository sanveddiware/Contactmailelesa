// mailer.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// send email
export async function sendThankYouEmail(to, name, event) {
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

  await transporter.sendMail(mailOptions);
}
