const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch products", error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { name, description, price, stock, image } = req.body;

  if (!name || !price || !stock) {
    return res
      .status(400)
      .json({ message: "Please provide name, price, and stock" });
  }

  try {
    const product = new Product({ name, description, price, stock, image });
    await product.save();
    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error adding product", error: error.message });
  }
});

module.exports = router;
