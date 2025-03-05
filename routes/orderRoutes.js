const express = require("express");
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { products, totalAmount } = req.body;

  try {
    const order = new Order({ user: req.user.id, products, totalAmount });
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error placing order", error });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate(
    "products.product"
  );
  res.json(orders);
});

module.exports = router;
