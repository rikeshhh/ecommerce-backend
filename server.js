const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const session = require("express-session");
const passport = require("./config/passport");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const usersRouter = require("./routes/userRoutes");
const analyticsRouter = require("./routes/analyticsRoutes");
const dashboardStatsRouter = require("./routes/dashboardStatRoutes");
const favoritesRouter = require("./routes/favouriteRoutes");
const commentRoutes = require("./routes/comments");
const promoRoutes = require("./routes/promoRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const giveawayRoutes = require("./routes/giveawayRoutes");
const contactRoutes = require("./routes/contactRoutes");
const adsRouter = require("./routes/adRoute");
dotenv.config();

const app = express();
app.set("view engine", "ejs");

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/checkout", (req, res) => {
  res.render("checkout", {
    stripePublishableKey:
      "pk_test_51OjwOvGVlCN6HNjt9tyzrSOp9Eyqz1xoRCMz0yGf1Z2DgjXqzMWXEeRIzBzRBuDURBqOk9zjRqvEbQPrKlh53zFP00lxF0fD1o",
  });
});
app.use("/api/ads", adsRouter);
app.use("/api/users", usersRouter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/analytics", analyticsRouter);
app.use("/api/dashboard-stats", dashboardStatsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/comments", commentRoutes);
app.get("/api/test", (req, res) => res.json({ message: "Backend is live" }));
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/giveaway", giveawayRoutes);
app.use("/api/contact", contactRoutes);
const PORT = process.env.PORT || 5001;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server due to MongoDB error:", err);
    process.exit(1);
  });
