const express = require("express");
const router = express.Router();
const Promo = require("../models/Promo");
const authMiddleware = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

router.post("/create", authMiddleware, isAdmin, async (req, res) => {
  const { code, discount, startDate, endDate, productIds, category } = req.body;

  try {
    const promo = new Promo({
      code,
      discount,
      startDate,
      endDate,
      productIds: productIds || undefined,
      category: category || undefined,
    });
    await promo.save();
    res.status(201).json({ success: true, promo });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/validate", authMiddleware, async (req, res) => {
  const { code, orders } = req.body;
  const now = new Date();

  try {
    const promo = await Promo.findOne({
      code,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!promo) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired promo code" });
    }

    const applies = orders.some((order) =>
      promo.productIds
        ? order.products.some((p) => promo.productIds.includes(p.product))
        : promo.category
        ? order.products.some(async (p) => {
            const product = await mongoose.model("Product").findById(p.product);
            return product?.category === promo.category;
          })
        : true
    );

    if (!applies) {
      return res.status(400).json({
        success: false,
        message: "Promo code does not apply to your order",
      });
    }

    res.json({
      success: true,
      promo: { code: promo.code, discount: promo.discount },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
