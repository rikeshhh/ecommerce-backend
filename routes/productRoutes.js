const express = require("express");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const multer = require("multer");
const path = require("path");
const { default: mongoose } = require("mongoose");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpeg, jpg, png, gif) are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

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
    if (search) {
      const searchStr = String(search).trim();
      query.$or = [{ name: { $regex: searchStr, $options: "i" } }];
    }

    if (category) {
      query.category = { $regex: String(category).trim(), $options: "i" };
    }

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      console.log("Received date range:", { from, to, fromDate, toDate });
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }
      query.createdAt = { $gte: fromDate, $lte: toDate };
      console.log("Applying date filter:", query.createdAt);
    }

    console.log("Final query:", query);
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalProducts = await Product.countDocuments(query);

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
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    console.log("Fetched product:", product);
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

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const product = new Product({
      name,
      description: description || null,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      image,
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
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price ? parseFloat(price) : product.price;
      product.stock = stock ? parseInt(stock) : product.stock;
      product.image = image || product.image;
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

module.exports = router;
