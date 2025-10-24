import express from "express";
import Feedback from "../models/Feedback.js";

const router = express.Router();

// 🟢 POST feedback (user submits a review)
router.post("/", async (req, res) => {
  try {
    const { name, title, content } = req.body;

    if (!name || !title || !content) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const feedback = new Feedback({ name, title, content });
    await feedback.save();

    res.status(201).json({ message: "Feedback submitted successfully!", feedback });
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🟣 GET feedback (fetch all testimonials)
router.get("/", async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }); // latest first
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
