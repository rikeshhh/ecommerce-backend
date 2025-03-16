const express = require("express");
const router = express.Router();
const HeroSlide = require("../models/HeroSlides");
const defaultSlides = require("../utils/defaultSlides");
const authMiddleware = require("../middleware/authMiddleware");
const { put } = require("@vercel/blob");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", async (req, res) => {
  try {
    const slides = await HeroSlide.find({ isActive: true });

    if (slides.length === 0) {
      await HeroSlide.insertMany(defaultSlides);
      const seededSlides = await HeroSlide.find({ isActive: true });
      return res.status(200).json(seededSlides);
    }

    res.status(200).json(slides);
  } catch (error) {
    console.error("GET / error:", error);
    res.status(500).json({ error: "Failed to fetch hero slides" });
  }
});

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { title, description, ctaText, ctaLink, theme, altText } = req.body;

    if (!title || !ctaText || !ctaLink) {
      return res
        .status(400)
        .json({ error: "Title, CTA Text, and CTA Link are required" });
    }

    let imageSrc = null;
    if (req.file) {
      const blob = await put(req.file.originalname, req.file.buffer, {
        access: "public",
      });
      imageSrc = blob.url;
    }

    const newSlide = new HeroSlide({
      title,
      description: description || "",
      ctaText,
      ctaLink,
      imageSrc,
      theme: theme || "Indigo",
      altText: altText || "",
      isActive: true,
    });

    await newSlide.save();
    res.status(201).json(newSlide);
  } catch (error) {
    console.error("POST / error:", error);
    res.status(500).json({ error: "Failed to create hero slide" });
  }
});

router.put("/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, ctaText, ctaLink, theme, altText } = req.body;

    if (!title || !ctaText || !ctaLink) {
      return res
        .status(400)
        .json({ error: "Title, CTA Text, and CTA Link are required" });
    }

    const updateData = {
      title,
      description: description || "",
      ctaText,
      ctaLink,
      theme: theme || "Indigo",
      altText: altText || "",
    };

    if (req.file) {
      const blob = await put(req.file.originalname, req.file.buffer, {
        access: "public",
      });
      updateData.imageSrc = blob.url;
    }

    const updatedSlide = await HeroSlide.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedSlide) {
      return res.status(404).json({ error: "Hero slide not found" });
    }

    res.status(200).json(updatedSlide);
  } catch (error) {
    console.error("PUT /:id error:", error);
    res.status(500).json({ error: "Failed to update hero slide" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSlide = await HeroSlide.findByIdAndDelete(id);

    if (!deletedSlide) {
      return res.status(404).json({ error: "Hero slide not found" });
    }

    res.status(200).json({ message: "Hero slide deleted successfully" });
  } catch (error) {
    console.error("DELETE /:id error:", error);
    res.status(500).json({ error: "Failed to delete hero slide" });
  }
});

module.exports = router;
