const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendFailureEmail(subject, html) {
  try {
    console.log("📤 Sending failure alert email...");

    const info = await transporter.sendMail({
      from: `"Busy Sync Alert" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject,
      html,
    });

    console.log("✅ Email sent successfully!");
    console.log("📨 Message ID:", info.messageId);
    console.log("📧 Response:", info.response);

    return info;

  } catch (error) {
    console.error("❌ Email sending failed!");
    console.error("Reason:", error.message);

    throw error;
  }
}

module.exports = { sendFailureEmail };