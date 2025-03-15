const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const sendEmail = require("../mailer");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { products, totalAmount } = req.body;
  const userId = req.user.id;

  console.log("Environment variables:", {
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? "[REDACTED]" : undefined,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  });

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

    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    console.log("Attempting to send email to:", adminEmail);

    if (!adminEmail || adminEmail === "admin@example.com") {
      console.warn(
        "Admin email not configured properly; skipping email notification"
      );
    } else {
      const emailSubject = "New Order Placed";
      const populatedOrder = await Order.findById(order._id).populate(
        "products.product",
        "name price"
      );
      if (!populatedOrder) {
        console.error("Failed to populate order:", order._id);
        throw new Error("Failed to populate order details");
      }

      const productDetails = populatedOrder.products
        .map(
          (p) =>
            `- ${p.product.name} (Qty: ${p.quantity}, Price: $${p.product.price})`
        )
        .join("\n");
      const emailText = `
        A new order has been placed by ${user.name}.
        Order Details:
        - Order ID: ${order._id}
        - Total Amount: $${totalAmount}
        - Products:
        ${productDetails}
        - Status: ${order.status}
        - Payment Status: ${order.paymentStatus}
        - Date: ${new Date().toLocaleString()}
      `;

      try {
        await sendEmail({
          to: adminEmail,
          subject: emailSubject,
          text: emailText,
        });
        console.log(
          `Email successfully sent to ${adminEmail} for order ${order._id}`
        );
      } catch (emailError) {
        console.error("Failed to send email to admin:", emailError.message);
      }
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error.message, error.stack);
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
