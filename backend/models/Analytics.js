const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    // Shop-level analytics
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      index: true,
    },
    shopName: { type: String, default: "" },
    shopViewCount: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },

    // Item-level analytics
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      index: true,
    },
    itemName: { type: String, default: "" },
    itemViewCount: { type: Number, default: 0 },
    itemPrice: { type: Number, default: 0 },
    itemCategory: { type: String, default: "" },

    // Track when data was last updated
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for efficient queries
analyticsSchema.index({ shopId: 1, shopViewCount: -1 });
analyticsSchema.index({ itemId: 1, itemViewCount: -1 });
analyticsSchema.index({ shopViewCount: -1, createdAt: -1 });
analyticsSchema.index({ itemViewCount: -1, createdAt: -1 });

module.exports = mongoose.model("Analytics", analyticsSchema);
