require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static("public")); // Serve static files

// Set View Engine
app.set("view engine", "ejs");

// Routes
app.use("/users", require("./routes/userRoutes"));

// Home Page Route
app.get("/", (req, res) => {
  res.render("index", { title: "Home Page" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
