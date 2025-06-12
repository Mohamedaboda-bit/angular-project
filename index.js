const mongoose = require("mongoose");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

<<<<<<< HEAD
dotenv.config({ path: "./config.env" }); 

process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    process.exit(1); 
});

const app = require("./app"); 

=======
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
>>>>>>> 1ebb94456f9d55c46580ade58c26d7196910e5e8
const DB = process.env.DATABASE_URL

mongoose
    .connect(DB)
    .then(() => console.log("DB connection successful!"))
    .catch(err => console.error("DB Connection Error: ", err));

<<<<<<< HEAD
=======
// Start Server
>>>>>>> 1ebb94456f9d55c46580ade58c26d7196910e5e8
const port = process.env.PORT || 3000;
const server = app.listen(port, "0.0.0.0", () => {
    console.log(`App running on port ${port}...`);
});

<<<<<<< HEAD
process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    server.close(() => { 
=======
// Handle Unhandled Promise Rejections (Async code errors)
process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    server.close(() => { // Gracefully close server before exiting
>>>>>>> 1ebb94456f9d55c46580ade58c26d7196910e5e8
        process.exit(1);
    });
});

<<<<<<< HEAD
=======
// Handle SIGTERM for graceful shutdown (e.g., from Heroku, Docker)
>>>>>>> 1ebb94456f9d55c46580ade58c26d7196910e5e8
process.on("SIGTERM", () => {
    console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
        console.log("💥 Process terminated!");
<<<<<<< HEAD
=======
        // Mongoose connection closed automatically on process exit
>>>>>>> 1ebb94456f9d55c46580ade58c26d7196910e5e8
    });
});

