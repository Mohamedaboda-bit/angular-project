const mongoose = require("mongoose");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

// Load environment variables from .env file
dotenv.config({ path: "./config.env" }); // Assuming config.env is in the root

// Handle Uncaught Exceptions (Sync code errors)
process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    process.exit(1); // Exit immediately
});

const app = require("./app"); // Import the configured express app

// Database Connection
const DB = process.env.DATABASE_URL

mongoose
    .connect(DB)
    .then(() => console.log("DB connection successful!"))
    .catch(err => console.error("DB Connection Error: ", err));

// Start Server
const port = process.env.PORT || 3000;
const server = app.listen(port, "0.0.0.0", () => {
    console.log(`App running on port ${port}...`);
});

// Handle Unhandled Promise Rejections (Async code errors)
process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    server.close(() => { // Gracefully close server before exiting
        process.exit(1);
    });
});

// Handle SIGTERM for graceful shutdown (e.g., from Heroku, Docker)
process.on("SIGTERM", () => {
    console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
        console.log("💥 Process terminated!");
        // Mongoose connection closed automatically on process exit
    });
});

