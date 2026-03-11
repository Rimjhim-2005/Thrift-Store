const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Auth API working");
});

// Register user
router.post("/register", (req, res) => {
  res.json({ message: "User registered successfully" });
});

// Login user
router.post("/login", (req, res) => {
  res.json({ message: "User logged in successfully" });
});

// Get user profile (test protected route later)
router.get("/profile", (req, res) => {
  res.json({ message: "User profile fetched" });
});

module.exports = router;
