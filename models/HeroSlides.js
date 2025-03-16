const mongoose = require("mongoose");

const HeroSlideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  ctaText: { type: String, required: true },
  ctaLink: { type: String, required: true },
  imageSrc: { type: String, required: true },
  theme: { type: String, default: "Indigo" },
  altText: { type: String, default: "Slide Image" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("HeroSlide", HeroSlideSchema);
