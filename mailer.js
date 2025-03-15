const nodemailer = require("nodemailer");

const getTransporter = () => {
  console.log("Creating transporter with:", {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  });
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  console.log("sendEmail called with:", { to, subject, text, html });
  if (!to) {
    throw new Error("No recipients defined");
  }
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text: text || undefined,
    html: html || undefined,
  };
  const transporter = getTransporter();
  console.log("Transporter auth config:", transporter.options.auth);
  console.log("Mail options sent to Nodemailer:", mailOptions);
  await transporter.sendMail(mailOptions);
  console.log("Email sent successfully to:", to);
};

module.exports = sendEmail;
