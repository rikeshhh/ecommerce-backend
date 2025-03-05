const Product = require("../models/Product");

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      image,
      stock,
    });

    await product.save();
    res.status(201).json({ message: "Product added successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
