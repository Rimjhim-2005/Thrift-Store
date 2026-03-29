const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    sellerId:    { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price:       { type: Number, required: true },
    category:    { type: String, default: "" },
    // Expanded to match all options shown in the ListItem form
    condition: {
      type: String,
      enum: ["New with tags", "Like new", "New", "Like New", "Good", "Fair", "Well loved"],
      default: "Good",
    },
    images:      [{ type: String }],  // file paths
    stock:       { type: Number, default: 1 },
    viewCount:   { type: Number, default: 0 },  // Track item views
  },
  { timestamps: true }
);

// Virtual so code can read item.title alongside item.name
itemSchema.virtual("title").get(function () { return this.name; });

module.exports = mongoose.model("Item", itemSchema);
