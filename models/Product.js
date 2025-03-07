const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    sku: { type: String, default: uuidv4, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    image: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
