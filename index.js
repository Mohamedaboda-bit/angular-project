const mongoose = require("mongoose");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");

dotenv.config({ path: "./config.env" }); 

process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    process.exit(1); 
});

const app = require("./app"); 

const DB = process.env.DATABASE_URL

mongoose
    .connect(DB)
    .then(() => console.log("DB connection successful!"))
    .catch(err => console.error("DB Connection Error: ", err));

const port = process.env.PORT || 3000;
const server = app.listen(port, "0.0.0.0", () => {
    console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err.name, err.message);
    server.close(() => { 
        process.exit(1);
    });
});

process.on("SIGTERM", () => {
    console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
    server.close(() => {
        console.log("💥 Process terminated!");
    });
});

