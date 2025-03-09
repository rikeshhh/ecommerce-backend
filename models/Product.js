const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String, required: true },
  image: String,
});

module.exports = mongoose.model("Product", productSchema);
