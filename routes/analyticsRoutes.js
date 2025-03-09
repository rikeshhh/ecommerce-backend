const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
  const { timeRange } = req.query;
  let dateFilter = {};
  if (timeRange === "7d")
    dateFilter = {
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    };
  else if (timeRange === "30d")
    dateFilter = {
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    };
  else if (timeRange === "90d")
    dateFilter = {
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    };

  const orderStatus = await Order.aggregate([
    { $match: dateFilter },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const revenueByDate = await Order.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: { $sum: "$totalAmount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const heatmapData = [[], []];
  const statusCounts = { Pending: 0, Shipped: 0, Cancelled: 0 };
  orderStatus.forEach((item) => (statusCounts[item._id] = item.count));

  res.json({
    orderStatus: statusCounts,
    revenueByDate,
    heatmapData,
    totalRevenue: revenueByDate.reduce((sum, d) => sum + d.total, 0),
  });
});

module.exports = router;
