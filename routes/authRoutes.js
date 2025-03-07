const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../mailer");

const router = express.Router();
router.post("/register", async (req, res) => {
  console.log("POST /register received:", req.body); // Log incoming request
  const { name, email, password, isAdmin } = req.body;

  try {
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed:", hashedPassword);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin,
    });
    console.log("Saving user to DB...");
    await user.save();
    console.log("User saved successfully");

    const emailSubject = "Welcome to Our Platform!";
    const emailText = `Hello ${name} laudeeyy,\n\nThank you for registering with us. We are excited to have you on board!`;
    const emailHtml = `<h1>Hello ${name}</h1><p>Thank you for registering with us. We are excited to have you on board!</p>`;

    console.log("Sending email to:", email);
    await sendEmail(email, emailSubject, emailText, emailHtml);
    console.log("Email sent successfully");

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
});
module.exports = router;

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
router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});
router.get("/logout", (req, res) => {
  res.json({ message: "User logged out successfully" });
});

module.exports = router;
