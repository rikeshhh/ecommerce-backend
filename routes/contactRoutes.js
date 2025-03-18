const express = require("express");
const router = express.Router();
const sendEmail = require("../mailer");

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const toSupport = {
      to: process.env.SUPPORT_EMAIL || "support@example.com",
      subject: `New Contact Form Submission: ${subject}`,
      text: `From: ${name} <${email}>\n\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    };

    const toUser = {
      to: email,
      subject: "We’ve Received Your Message!",
      text: `Hi ${name},\n\nThanks for reaching out! We’ve received your message and will get back to you soon.\n\nYour Subject: ${subject}\nYour Message:\n${message}\n\nBest,\nThe E-Shop Team`,
      html: `
        <h2>Thanks for Contacting Us, ${name}!</h2>
        <p>We’ve received your message and will respond as soon as possible.</p>
        <p><strong>Your Subject:</strong> ${subject}</p>
        <p><strong>Your Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
        <p>Best regards,<br>The E-Shop Team</p>
      `,
    };

    await sendEmail(toSupport);
    await sendEmail(toUser);

    res
      .status(200)
      .json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    console.error("Contact form email error:", error);
    res.status(500).json({
      message: "Failed to send message",
      error: error.message || "Server error",
    });
  }
});

module.exports = router;
