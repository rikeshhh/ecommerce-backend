const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const sendEmail = require("../mailer");
const {
  generateCustomerOrderUpdateEmail,
} = require("../emails/customerOrderUpdate");
const {
  generateAdminOrderNotificationEmail,
} = require("../emails/adminOrderNotification");
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
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

    const productIds = products.map((p) => p.product);
    const productDocs = await Product.find({ _id: { $in: productIds } }).select(
      "name price image"
    );
    const productMap = new Map(productDocs.map((p) => [p._id.toString(), p]));

    const enrichedProducts = products.map((p) => ({
      product: p.product,
      quantity: p.quantity,
      image: productMap.get(p.product.toString())?.image || "",
    }));

    const order = new Order({
      user: userId,
      customerName: user.name,
      products: enrichedProducts,
      totalAmount,
      status: "Placed",
      paymentStatus: "Paid",
    });
    await order.save();

    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const populatedOrder = await Order.findById(order._id).populate(
      "products.product",
      "name price image"
    );

    if (!populatedOrder) {
      console.error("Failed to populate order:", order._id);
      throw new Error("Failed to populate order details");
    }

    if (adminEmail !== "admin@example.com") {
      const adminEmailSubject = "New Order Placed";
      const adminEmailHtml = generateAdminOrderNotificationEmail({
        customerName: user.name,
        orderId: order._id,
        totalAmount: order.totalAmount,
        products: populatedOrder.products,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: new Date(order.createdAt).toLocaleString(),
      });

      await sendEmail({
        to: adminEmail,
        subject: adminEmailSubject,
        html: adminEmailHtml,
      });
      console.log(`Admin email sent to ${adminEmail} for order ${order._id}`);
    }

    const customerEmailSubject = `Order Confirmation: ${order._id}`;
    const customerEmailHtml = generateCustomerOrderUpdateEmail({
      customerName: user.name,
      orderId: order._id,
      newStatus: order.status,
      updatedAt: new Date(order.createdAt).toLocaleString(),
    });

    await sendEmail({
      to: user.email,
      subject: customerEmailSubject,
      html: customerEmailHtml,
    });
    console.log(`Customer email sent to ${user.email} for order ${order._id}`);

    res.status(201).json(populatedOrder);
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

  const query = isAdmin ? {} : { user: userId };

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
      .populate("products.product", "name price image");
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
        .populate("products.product", "name price image");
    } else {
      order = await Order.findOne({ _id: orderId, user: req.user.id })
        .populate("user", "name email")
        .populate("products.product", "name price image");
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

  try {
    const order = await Order.findById(id).populate(
      "products.product",
      "name price image"
    );
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
