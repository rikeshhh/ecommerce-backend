const express = require("express");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware"); // Assuming you have an admin check middleware

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

router.post("/", authMiddleware, isAdmin, async (req, res) => {
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

router.put("/:id", authMiddleware, isAdmin, async (req, res) => {
  const { name, description, price, stock, image } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock || product.stock;
    product.image = image || product.image;

    await product.save();

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
});

module.exports = router;
