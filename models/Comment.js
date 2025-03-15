const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  comment: { type: String, required: true, maxlength: 500 },
  rating: { type: Number, min: 1, max: 5, default: null },
  createdAt: { type: Date, default: Date.now },
  isVerifiedBuyer: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
});

commentSchema.index({ product: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
