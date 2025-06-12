const express = require("express");
const cors = require("cors");
const path = require("path");

// Routers
const authRouter = require("./routes/authRoutes");
const examRouter = require("./routes/examRoutes");
const resultRouter = require("./routes/resultRoutes");

// Import error handlers
const { notFoundHandler, errorHandler } = require("./middlewares/error-handler");

const app = express();

// --- Global Middlewares ---

// Enable CORS for all origins (adjust in production!)
app.use(cors());
// Or configure specific origins:
// app.use(cors({
//   origin: 'YOUR_FRONTEND_URL'
// }));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // For form data

// --- Routes ---
app.get("/", (req, res) => {
    res.send("Exam System Backend is running!");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/exams", examRouter);
app.use("/api/v1/results", resultRouter);

// Handle undefined routes
app.all("/", notFoundHandler);

// Use the global error handling middleware
app.use(errorHandler);

module.exports = app;
