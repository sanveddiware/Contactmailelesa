import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ✅ create transporter with OAuth2
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID_OAuth,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
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

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Thank you email sent to ${to}`);
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
}
