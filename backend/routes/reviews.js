const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Seller = require("../models/Seller");
const mongoose = require("mongoose");

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Please log in first." });
  }
  next();
}

// POST /api/reviews - Create or update a review
router.post("/", requireAuth, async (req, res) => {
  try {
    const { sellerId, rating, comment } = req.body;

    if (!sellerId || !rating) {
      return res.status(400).json({ message: "Seller ID and rating are required." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    // Validate seller exists
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found." });
    }

    const userId = req.session.userId;

    // Upsert review (update if exists, create if not)
    const review = await Review.findOneAndUpdate(
      { sellerId, userId },
      { rating, comment: comment || "" },
      { upsert: true, new: true, runValidators: true }
    );

    // Recalculate average rating
    const stats = await Review.aggregate([
      { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
      {
        $group: {
          _id: "$sellerId",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      seller.averageRating = Math.round(stats[0].averageRating * 10) / 10; // Round to 1 decimal
      seller.reviewCount = stats[0].reviewCount;
      await seller.save();
    }

    return res.status(200).json({
      message: "Review submitted successfully!",
      review,
      sellerRating: seller.averageRating,
      reviewCount: seller.reviewCount,
    });
  } catch (err) {
    console.error("Review submission error:", err);
    return res.status(500).json({ message: "Failed to submit review." });
  }
});

// GET /api/reviews/:sellerId - Get all reviews for a seller
router.get("/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({ message: "Invalid seller ID." });
    }

    const reviews = await Review.find({ sellerId })
      .populate("userId", "username")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      username: r.userId?.username || "Anonymous",
      createdAt: r.createdAt,
    }));

    return res.status(200).json({ reviews: formatted });
  } catch (err) {
    console.error("Get reviews error:", err);
    return res.status(500).json({ message: "Failed to fetch reviews." });
  }
});

// DELETE /api/reviews/:reviewId - Delete own review
router.delete("/:reviewId", requireAuth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.session.userId;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ message: "Review not found or not authorized." });
    }

    const sellerId = review.sellerId;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate average rating
    const seller = await Seller.findById(sellerId);
    if (seller) {
      const stats = await Review.aggregate([
        { $match: { sellerId: new mongoose.Types.ObjectId(sellerId) } },
        {
          $group: {
            _id: "$sellerId",
            averageRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ]);

      if (stats.length > 0) {
        seller.averageRating = Math.round(stats[0].averageRating * 10) / 10;
        seller.reviewCount = stats[0].reviewCount;
      } else {
        seller.averageRating = 0;
        seller.reviewCount = 0;
      }
      await seller.save();
    }

    return res.status(200).json({ message: "Review deleted successfully." });
  } catch (err) {
    console.error("Delete review error:", err);
    return res.status(500).json({ message: "Failed to delete review." });
  }
});

// GET /api/reviews/user/:sellerId - Check if user has reviewed this seller
router.get("/user/:sellerId", requireAuth, async (req, res) => {
  try {
    const { sellerId } = req.params;
    const userId = req.session.userId;

    const review = await Review.findOne({ sellerId, userId }).lean();

    return res.status(200).json({
      hasReviewed: !!review,
      review: review
        ? {
            id: review._id,
            rating: review.rating,
            comment: review.comment,
          }
        : null,
    });
  } catch (err) {
    console.error("Check review error:", err);
    return res.status(500).json({ message: "Failed to check review status." });
  }
});

module.exports = router;
