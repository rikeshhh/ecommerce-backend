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
    const order = new Order({
      user: req.user.id,
      products,
      totalAmount,
      status: "Pending",
    });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error("Error placing order:", error);
    res
      .status(500)
      .json({ message: "Failed to create order", error: error.message });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log("User ID:", req.user.id, "Is Admin:", req.user.isAdmin);
    let orders;
    if (req.user.isAdmin) {
      orders = await Order.find()
        .populate("user", "name")
        .populate("products.product");
    } else {
      orders = await Order.find({ user: req.user.id })
        .populate("user", "name")
        .populate("products.product");
    }
    console.log("Orders found:", orders.length);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
});
router.get("/:orderId", authMiddleware, async (req, res) => {
  const { orderId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    let order;
    if (req.user.isAdmin) {
      order = await Order.findById(orderId)
        .populate("user", "name")
        .populate("products.product");
    } else {
      order = await Order.findOne({ _id: orderId, user: req.user.id })
        .populate("user", "name")
        .populate("products.product");
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch order", error: error.message });
  }
});

router.patch("/:orderId", authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  if (
    !status ||
    !["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)
  ) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    let order;
    if (req.user.isAdmin) {
      order = await Order.findById(orderId);
    } else {
      order = await Order.findOne({ _id: orderId, user: req.user.id });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    order.updatedAt = new Date();
    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .json({ message: "Failed to update order", error: error.message });
  }
});

module.exports = router;
