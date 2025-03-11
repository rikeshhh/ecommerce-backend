const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Product");

router.post("/", async (req, res) => {
  const { productId, userId } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let user;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: "User not found" });
    } else if (userId) {
      user = { _id: userId, favorites: [] }; // Mock user for public
    } else {
      return res.status(400).json({ message: "User ID or token required" });
    }

    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      if (token) await user.save();
    }

    res
      .status(200)
      .json({ message: "Added to favorites", favorites: user.favorites });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding to favorites", error: error.message });
  }
});

router.delete("/:productId", async (req, res) => {
  const { productId } = req.params;
  const token = req.headers.authorization?.split(" ")[1];
  const { userId } = req.body;

  try {
    let user;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: "User not found" });
    } else if (userId) {
      user = { _id: userId, favorites: [] }; // Mock user
    } else {
      return res.status(400).json({ message: "User ID or token required" });
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== productId);
    if (token) await user.save();

    res
      .status(200)
      .json({ message: "Removed from favorites", favorites: user.favorites });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error removing from favorites", error: error.message });
  }
});

router.get("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { userId } = req.query;
  let user;
  if (token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    user = await User.findById(decoded.id).populate("favorites");
  } else if (userId) {
    user = { _id: userId, favorites: [] };
  } else {
    return res.status(400).json({ message: "User ID or token required" });
  }
  res.status(200).json({ favorites: user.favorites });
});

module.exports = router;
