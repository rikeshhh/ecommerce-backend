const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../mailer");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password, isAdmin } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin,
    });
    await user.save();

    const emailSubject = "Welcome to Our Platform!";
    const emailText = `Hello ${name},\n\nThank you for registering with us. We are excited to have you on board!`;
    const emailHtml = `<h1>Hello ${name}</h1><p>Thank you for registering with us. We are excited to have you on board!</p>`;

    await sendEmail(email, emailSubject, emailText, emailHtml);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
});

router.get("/logout", (req, res) => {
  res.json({ message: "User logged out successfully" });
});

module.exports = router;
