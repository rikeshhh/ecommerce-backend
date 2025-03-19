const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    dateFrom,
    dateTo,
    role,
    isBanned,
  } = req.query;
  const query = {};

  if (search) {
    const searchTerms = search.split(" ").filter(Boolean);
    query.$and = searchTerms.map((term) => ({
      $or: [
        { _id: { $regex: term, $options: "i" } },
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
      ],
    }));
  }

  if (dateFrom && dateTo) {
    query.createdAt = { $gte: new Date(dateFrom), $lte: new Date(dateTo) };
  } else if (dateFrom) {
    query.createdAt = { $gte: new Date(dateFrom) };
  } else if (dateTo) {
    query.createdAt = { $lte: new Date(dateTo) };
  }

  if (role) {
    query.isAdmin = role === "Admin";
  }

  if (typeof isBanned !== "undefined") {
    query.isBanned = isBanned === "true";
  }

  try {
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select("_id name email isAdmin isBanned createdAt updatedAt");
    const totalUsers = await User.countDocuments(query);

    res.json({
      users,
      totalUsers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / limit),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(500)
      .json({ message: "Failed to delete user", error: error.message });
  }
});
router.patch("/:id/ban", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { isBanned } = req.body;

  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isBanned = isBanned;
    await user.save();

    res.json({ _id: user._id, isBanned: user.isBanned });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
