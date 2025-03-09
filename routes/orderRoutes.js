const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");
const sendEmail = require("../mailer");
require("dotenv").config();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { products, totalAmount, paymentMethodId } = req.body;

  console.log("Received order data:", {
    products,
    totalAmount,
    paymentMethodId,
  });

  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: "Products array is required" });
  }
  if (!paymentMethodId) {
    return res.status(400).json({ message: "Payment method ID is required" });
  }
  if (!totalAmount || typeof totalAmount !== "number" || totalAmount <= 0) {
    return res.status(400).json({ message: "Invalid total amount" });
  }

  for (const item of products) {
    if (!mongoose.Types.ObjectId.isValid(item.product)) {
      return res
        .status(400)
        .json({ message: `Invalid product ID: ${item.product}` });
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res
        .status(400)
        .json({ message: `Invalid quantity for product: ${item.product}` });
    }
  }

  try {
    const amountInCents = Math.round(totalAmount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    });

    console.log("PaymentIntent created:", paymentIntent);

    const order = new Order({
      user: req.user.id,
      products: products.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      })),
      totalAmount,
      status: "Placed",
      paymentStatus: paymentIntent.status === "succeeded" ? "Paid" : "Pending",
    });
    await order.save();

    console.log("Saved order:", order);

    res.status(201).json(order);
  } catch (error) {
    console.error("Stripe error:", error);
    res
      .status(500)
      .json({ message: "Failed to create order", error: error.message });
  }
});
router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log("User ID:", req.user.id, "Is Admin:", req.user.isAdmin);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let ordersQuery;
    if (req.user.isAdmin) {
      ordersQuery = Order.find();
    } else {
      ordersQuery = Order.find({ user: req.user.id });
    }

    const totalOrders = await Order.countDocuments(
      req.user.isAdmin ? {} : { user: req.user.id }
    );

    const orders = await ordersQuery
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .populate("products.product");

    console.log("Orders found:", orders.length, "Page:", page, "Limit:", limit);

    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      totalOrders,
      currentPage: page,
      totalPages,
      limit,
    });
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

router.patch("/:orderId", authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  const { status, paymentStatus } = req.body;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  const validStatuses = [
    "Placed",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  const validPaymentStatuses = ["Pending", "Paid", "Failed"];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }
  if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
    return res.status(400).json({ message: "Invalid payment status" });
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

    if (status) order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (order.paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.paymentIntentId
        );
        if (paymentIntent.status === "succeeded" && paymentStatus !== "Paid") {
          return res
            .status(400)
            .json({ message: "Payment status cannot contradict Stripe" });
        }
      }
    }

    order.updatedAt = new Date();
    await order.save();

    const user = await mongoose.model("User").findById(order.user);
    const subject = `Order ${order._id} Status Update`;
    const text = `Your order ${order._id} has been updated. Status: ${order.status}, Payment Status: ${order.paymentStatus}.`;
    const html = `<p>Your order ${order._id} has been updated. Status: <strong>${order.status}</strong>, Payment Status: <strong>${order.paymentStatus}</strong>.</p>`;
    await sendEmail(user.email, subject, text, html);

    res.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    res
      .status(500)
      .json({ message: "Failed to update order", error: error.message });
  }
});

module.exports = router;
