const express = require("express");
const router = express.Router();
const Ad = require("../models/ad");
const authMiddleware = require("../middleware/authMiddleware");
const { put, del } = require("@vercel/blob");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

router.get("/public", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const ads = await Ad.find({ status: "active" }).limit(limit);
    const totalAds = await Ad.countDocuments({ status: "active" });
    res.json({
      ads,
      totalAds,
      currentPage: 1,
      totalPages: Math.ceil(totalAds / limit) || 0,
      limit,
    });
  } catch (error) {
    console.error("Error fetching public ads:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const ads = await Ad.find({}).skip(skip).limit(limit);
    const totalAds = await Ad.countDocuments({});

    console.log("Ads fetched:", {
      totalAds,
      limit,
      page,
      totalPages: Math.ceil(totalAds / limit),
    });

    res.json({
      ads,
      totalAds,
      currentPage: page,
      totalPages: Math.ceil(totalAds / limit) || 0,
      limit,
    });
  } catch (error) {
    console.error("Error fetching ads:", error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  const { title, link, placement, startDate, endDate } = req.body;
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Admin access required" });
    if (!req.file)
      return res.status(400).json({ message: "Image is required" });

    const blob = await put(
      `ads/${Date.now()}-${req.file.originalname}`,
      req.file.buffer,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );

    const ad = new Ad({
      title,
      imageUrl: blob.url,
      link,
      placement: placement || "banner",
      status: "pending",
      sponsorId: req.user._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    });

    await ad.save();
    console.log("Created ad:", ad);
    res.status(201).json({ ad });
  } catch (error) {
    console.error("Error creating ad:", error);
    res
      .status(500)
      .json({ message: "Error creating ad", error: error.message });
  }
});

router.patch("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Admin access required" });
    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    ad.status = status;
    ad.updatedAt = new Date();
    await ad.save();
    res.json({ ad: { _id: ad._id, status: ad.status } });
  } catch (error) {
    console.error("Error updating ad:", error);
    res
      .status(500)
      .json({ message: "Error updating ad", error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.user.isAdmin)
      return res.status(403).json({ message: "Admin access required" });
    const ad = await Ad.findById(id);
    if (!ad) return res.status(404).json({ message: "Ad not found" });
    await del(ad.imageUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
    await Ad.findByIdAndDelete(id);
    res.json({ message: "Ad deleted successfully" });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res
      .status(500)
      .json({ message: "Error deleting ad", error: error.message });
  }
});

module.exports = router;
