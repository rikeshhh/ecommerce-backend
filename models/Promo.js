const mongoose = require("mongoose");

const PromoSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  productIds: { type: [String], default: undefined },
  category: { type: String, default: undefined },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Promo || mongoose.model("Promo", PromoSchema);
