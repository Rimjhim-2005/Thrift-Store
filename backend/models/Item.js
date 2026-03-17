const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    sellerId:    { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price:       { type: Number, required: true },
    category:    { type: String, default: "" },
    condition:   { type: String, enum: ["New", "Like New", "Good", "Fair"], default: "Good" },
    images:      [{ type: String }],  // file paths
    stock:       { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
