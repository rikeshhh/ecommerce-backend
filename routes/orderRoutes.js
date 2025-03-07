const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { products, totalAmount } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Products array is required" });
  }

  for (const item of products) {
    if (!mongoose.Types.ObjectId.isValid(item.product)) {
      return res
        .status(400)
        .json({ message: `Invalid product ID: ${item.product}` });
    }
  }

  try {
    const order = new Order({ user: req.user.id, products, totalAmount });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error placing order", error: error.message });
  }
});

module.exports = router;
