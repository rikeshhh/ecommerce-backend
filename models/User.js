const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  isBanned: { type: Boolean, default: false },
  location: {
    address: { type: String, required: true, default: "Unknown" },
    city: { type: String, required: true, default: "Unknown" },
    state: { type: String, required: true, default: "Unknown" },
    postalCode: { type: String, required: true, default: "00000" },
    country: { type: String, required: true, default: "Unknown" },
  },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
});

module.exports = mongoose.model("User", userSchema);
