const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const shopRoutes = require("./routes/shop");
const itemsRoutes = require("./routes/items");
const path = require("path");

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173", // Vite dev server
    credentials: true,               // Allow cookies to be sent
  })
);

// ── Sessions ───────────────────────────────────────────────
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: "lax",
      secure: false, // Set to true in production with HTTPS
    },
  })
);

// ── Static uploads ─────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ─────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/items", itemsRoutes);

// Health check
app.get("/", (req, res) => res.json({ message: "Thriftly API is running." }));

// ── Connect to MongoDB and start server ───────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
