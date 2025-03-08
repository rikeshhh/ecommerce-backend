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

router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate(
      "products.product"
    );
    res.json(orders);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching order history", error: error.message });
  }
});

router.get("/:orderId", authMiddleware, async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
    }).populate("products.product");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
});

module.exports = router;
