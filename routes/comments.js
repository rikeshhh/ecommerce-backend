const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Order = require("../models/Order");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, async (req, res) => {
  const { productId, comment, rating } = req.body;
  const userId = req.user.id;

  try {
    if (
      !productId ||
      !comment ||
      typeof comment !== "string" ||
      comment.trim() === ""
    ) {
      return res
        .status(400)
        .json({ message: "Product ID and comment are required" });
    }
    if (rating && (rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const order = await Order.findOne({
      user: userId,
      "products.product": productId,
    });
    if (!order) {
      return res
        .status(403)
        .json({ message: "You must purchase this product to comment" });
    }

    const newComment = new Comment({
      product: productId,
      user: userId,
      comment: comment.trim(),
      rating: rating || null,
    });

    await newComment.save();
    const populatedComment = await Comment.findById(newComment._id).populate(
      "user",
      "username"
    );

    res.status(201).json({ comment: populatedComment });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/", async (req, res) => {
  const { productId } = req.query;

  try {
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const comments = await Comment.find({ product: productId })
      .sort({ createdAt: -1 })
      .populate("user", "username")
      .lean();
    res.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
