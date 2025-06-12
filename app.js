const express = require("express");
const cors = require("cors");
const path = require("path");

<<<<<<< HEAD
=======
// Routers
>>>>>>> 1ebb94456f9d55c46580ade58c26d7196910e5e8
const authRouter = require("./routes/authRoutes");
const examRouter = require("./routes/examRoutes");
const resultRouter = require("./routes/resultRoutes");

<<<<<<< HEAD
const { notFoundHandler, errorHandler } = require("./middlewares/error-handler");

const app = express();

app.use(cors());

app.use(express.json({ limit: "10kb" })); 
app.use(express.urlencoded({ extended: true, limit: "10kb" })); 

=======
// Global Error Handler Utility
const AppError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    error.isOperational = true;
    Error.captureStackTrace(error, AppError);
    return error;
};

// Global Error Handling Middleware
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    // Log the error for debugging (especially non-operational errors)
    if (process.env.NODE_ENV === "development" || !err.isOperational) {
        console.error("ERROR 💥", err);
    }

    // Send operational errors to the client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    // Programming or other unknown error: don't leak error details
    } else {
        // Send generic message
        res.status(500).json({
            status: "error",
            message: "Something went very wrong!",
        });
    }
};

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
>>>>>>> 1ebb94456f9d55c46580ade58c26d7196910e5e8
app.get("/", (req, res) => {
    res.send("Exam System Backend is running!");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/exams", examRouter);
app.use("/api/v1/results", resultRouter);

<<<<<<< HEAD
app.all("/", notFoundHandler);

app.use(errorHandler);
=======
// Handle undefined routes
app.all("/", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Use the global error handling middleware
app.use(globalErrorHandler);
>>>>>>> 1ebb94456f9d55c46580ade58c26d7196910e5e8

module.exports = app;
