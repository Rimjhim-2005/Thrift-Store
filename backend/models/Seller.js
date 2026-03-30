const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    shopName:        { type: String, required: true, trim: true },
    slug:            { type: String, trim: true, sparse: true, unique: true },
    shopDescription: { type: String, default: "" },
    location:        { type: String, default: "" },
    hours:           { type: String, default: "" },
    phone:           { type: String, default: "" },
    shopEmail:       { type: String, default: "" },
    since:           { type: String, default: "" },
    category:        { type: String, default: "" },
    tags:            [{ type: String, trim: true }],
    orderCount:      { type: Number, default: 0 },
    viewCount:       { type: Number, default: 0 },
    headerImageUrl:  { type: String, default: "" },
    shopLogoUrl:     { type: String, default: "" },
    isApproved:      { type: Boolean, default: false },
    approvalToken:   { type: String },
    approvedAt:      { type: Date },
    averageRating:   { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:     { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seller", sellerSchema);
