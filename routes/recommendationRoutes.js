const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const tf = require("@tensorflow/tfjs");

let model;

async function trainModel() {
  const orders = await Order.find().populate("products.product");
  if (!orders.length) {
    console.log("No orders found, skipping model training");
    return;
  }

  console.log("Orders loaded:", orders.length);
  orders.forEach((order, idx) => {
    const invalidProducts = order.products.filter((p) => !p.product);
    if (invalidProducts.length) {
      console.warn(
        `Order ${idx} (${order._id}) has ${invalidProducts.length} invalid product(s)`
      );
    }
  });

  const userIds = [...new Set(orders.map((order) => order.user.toString()))];
  const productIds = [
    ...new Set(
      orders.flatMap((order) =>
        order.products
          .filter((p) => p.product)
          .map((p) => p.product._id.toString())
      )
    ),
  ];

  if (!productIds.length) {
    console.log("No valid products found in orders, skipping model training");
    return;
  }

  console.log(
    "Training with",
    userIds.length,
    "users and",
    productIds.length,
    "products"
  );

  const matrixData = Array(userIds.length)
    .fill(0)
    .map(() => Array(productIds.length).fill(0));
  orders.forEach((order) => {
    const userIdx = userIds.indexOf(order.user.toString());
    order.products
      .filter((p) => p.product)
      .forEach((p) => {
        const prodIdx = productIds.indexOf(p.product._id.toString());
        if (prodIdx !== -1) matrixData[userIdx][prodIdx] = 1;
      });
  });

  const matrix = tf.tensor2d(
    matrixData,
    [userIds.length, productIds.length],
    "float32"
  );

  const userFeatures = 5;
  const userMatrix = tf.variable(
    tf.randomNormal([userIds.length, userFeatures])
  );
  const productMatrix = tf.variable(
    tf.randomNormal([productIds.length, userFeatures])
  );

  const optimizer = tf.train.sgd(0.01);
  const ratings = matrix;

  for (let i = 0; i < 100; i++) {
    optimizer.minimize(() => {
      const predictions = userMatrix.matMul(productMatrix.transpose());
      const error = predictions.sub(ratings).square().mean();
      return error;
    });
  }

  model = { userMatrix, productMatrix, userIds, productIds };
  console.log("Model trained successfully");
}

trainModel().catch((err) => console.error("Training failed:", err));

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required" });

    if (!model)
      return res.status(503).json({ message: "Model not ready or no data" });

    const { userMatrix, productMatrix, userIds, productIds } = model;
    const userIdx = userIds.indexOf(userId.toString());
    if (userIdx === -1)
      return res.status(404).json({ message: "User not found in model" });

    const userVector = userMatrix.slice([userIdx, 0], [1, -1]);
    const predictions = userVector.matMul(productMatrix.transpose());
    const scores = predictions.dataSync();

    const topIndices = Array.from(scores)
      .map((score, idx) => ({ score, idx }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => productIds[item.idx]);

    const recommendedProducts = await Product.find({
      _id: { $in: topIndices },
    });

    res.json({ recommendations: recommendedProducts });
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
