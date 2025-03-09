const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const pendingOrders = await Order.countDocuments({ status: "Pending" });
    const recentActivity = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id createdAt")
      .lean()
      .then((orders) =>
        orders.map((order) => ({
          id: order._id,
          message: `Order #${order._id} placed`,
          timestamp: order.createdAt,
        }))
      );

    res.json({
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingOrders,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching dashboard stats", error });
  }
});

module.exports = router;
