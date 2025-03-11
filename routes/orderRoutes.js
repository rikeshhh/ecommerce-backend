const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");
const sendEmail = require("../mailer");
require("dotenv").config();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { products, totalAmount } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const order = new Order({
      user: userId,
      customerName: user.name,
      products,
      totalAmount,
      status: "Placed",
      paymentStatus: "Paid",
    });
    await order.save();

    res.status(201).json(order);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating order", error: error.message });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  const { page = 1, limit = 10, search, dateFrom, dateTo, status } = req.query;
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin; 

  const query = {};

  if (!isAdmin) {
    query.user = userId;
  }

  if (search) {
    query.$or = [
      { _id: { $regex: search, $options: "i" } },
      { customerName: { $regex: search, $options: "i" } },
    ];
  }
  if (dateFrom && dateTo) {
    query.createdAt = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
  }
  if (status) {
    query.status = status;
  }

  try {
    const orders = await Order.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate("products.product", "name price"); 
    const totalOrders = await Order.countDocuments(query);
    console.log(
      `Fetched orders for ${isAdmin ? "admin" : "user " + userId}:`,
      orders.length
    );
    res.json({
      orders,
      totalOrders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / limit),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Error fetching orders", error });
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
        .populate("user", "name email")
        .populate("products.product");
    } else {
      order = await Order.findOne({ _id: orderId, user: req.user.id })
        .populate("user", "name email")
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

router.patch("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  console.log("PATCH Request Body:", req.body);

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    order.updatedAt = new Date();

    await order.save();
    console.log("Updated Order:", order);
    res.json(order);
  } catch (error) {
    console.error("PATCH Error:", error.message);
    res
      .status(500)
      .json({ message: "Error updating order", error: error.message });
  }
});

module.exports = router;
