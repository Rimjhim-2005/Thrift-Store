const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/search", require("./routes/search.routes"));
app.use("/api/cart", require("./routes/cart.routes"));

app.get("/", (req, res) => {
  res.send("Thrift Store Backend Running ");
});

module.exports = app;
