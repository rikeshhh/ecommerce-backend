const mongoose = require("mongoose");

const adSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  link: { type: String, required: true },
  placement: { type: String, enum: ["banner", "table-row"], default: "banner" },
  status: {
    type: String,
    enum: ["pending", "active", "expired"],
    default: "pending",
  },
  sponsorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("ad", adSchema);
