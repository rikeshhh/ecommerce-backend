const express = require("express");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const multer = require("multer");
const path = require("path");
const { put } = require("@vercel/blob");
const { default: mongoose } = require("mongoose");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { search, category, from, to } = req.query;

  if (isNaN(page) || page < 1)
    return res.status(400).json({ message: "Invalid page number" });
  if (isNaN(limit) || limit < 1)
    return res.status(400).json({ message: "Invalid limit" });

  const query = {};

  try {
    if (search)
      query.$or = [{ name: { $regex: String(search).trim(), $options: "i" } }];
    if (category)
      query.category = { $regex: String(category).trim(), $options: "i" };
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      query.createdAt = { $gte: fromDate, $lte: toDate };
    }

    console.log("Fetching products with query:", query);
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments(query);

    if (!products.length) {
      console.warn("No products found for query:", query);
    }

    res.json({
      products,
      totalProducts,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      limit,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }
  try {
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    console.log("Fetched product by ID:", id);
    res.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
});

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (req.is("application/json") && Array.isArray(req.body)) {
      const productsData = req.body;

      const products = productsData.map((product) => {
        if (
          !product.name ||
          !product.price ||
          !product.stock ||
          !product.category
        ) {
          throw new Error(
            "Missing required fields: name, price, stock, or category"
          );
        }
        return {
          name: product.name,
          description: product.description || null,
          price: parseFloat(product.price),
          stock: parseInt(product.stock),
          category: product.category,
          image: product.image || null,
        };
      });

      const savedProducts = await Product.insertMany(products, {
        ordered: false,
      });
      return res.status(201).json({
        message: "Products created successfully",
        products: savedProducts,
      });
    }

    const { name, description, price, stock, category } = req.body;
    if (!name || !price || !stock || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let imageUrl = null;
    if (req.file) {
      const blob = await put(req.file.originalname, req.file.buffer, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      imageUrl = blob.url;
    }

    const product = new Product({
      name,
      description: description || null,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      image: imageUrl,
    });

    await product.save();
    res.status(201).json({ product });
  } catch (error) {
    console.error("Create error:", error);
    res
      .status(500)
      .json({ message: "Error adding product(s)", error: error.message });
  }
});

router.put(
  "/:id",
  authMiddleware,
  isAdmin,
  upload.single("image"),
  async (req, res) => {
    const { name, description, price, stock, category } = req.body;

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let imageUrl = product.image;
      if (req.file) {
        const blob = await put(req.file.originalname, req.file.buffer, {
          access: "public",
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        imageUrl = blob.url;
      } else if (req.body.image) {
        imageUrl = req.body.image;
      }

      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price ? parseFloat(price) : product.price;
      product.stock = stock ? parseInt(stock) : product.stock;
      product.image = imageUrl;
      product.category = category || product.category;

      await product.save();
      res
        .status(200)
        .json({ message: "Product updated successfully", product });
    } catch (error) {
      console.error("Error updating product:", error);
      res
        .status(500)
        .json({ message: "Error updating product", error: error.message });
    }
  }
);
router.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});
module.exports = router;
