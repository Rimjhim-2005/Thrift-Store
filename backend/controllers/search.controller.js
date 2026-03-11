const Product = require("../models/product.model");

exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q;

    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { color: { $regex: query, $options: "i" } },
        { style: { $regex: query, $options: "i" } },
        { era: { $regex: query, $options: "i" } },
        { tags: { $in: [query] } },
      ],
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
