const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    size: {
      type: String,
    },

    condition: {
      type: String,
    },

    desc: {
      type: String,
    },

    tags: {
      type: [String],
      default: [],
    },

    color: {
      type: String,
    },

    style: {
      type: String,
    },

    era: {
      type: String,
    },

    image: {
      type: String,
    },

    shopId: {
      type: Number,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
