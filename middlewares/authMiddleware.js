const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Utility function for error handling
const AppError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    error.isOperational = true; // Mark as operational error
    return error;
};

// Protect Routes Middleware
exports.protect = async (req, res, next) => {
    try {
        // 1) Getting token and check if it's there
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }
        // else if (req.cookies.jwt) { // Alternative: get token from cookie
        //     token = req.cookies.jwt;
        // }

        if (!token) {
            return next(new AppError("You are not logged in! Please log in to get access.", 401));
        }

        // 2) Verification token
        // Ensure JWT_SECRET is loaded from environment variables
        if (!process.env.JWT_SECRET) {
            console.error("FATAL ERROR: JWT_SECRET is not defined.");
            return next(new AppError("Server configuration error.", 500));
        }
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(new AppError("The user belonging to this token does no longer exist.", 401));
        }

        // Optional: Check if user changed password after the token was issued
        // if (currentUser.changedPasswordAfter(decoded.iat)) {
        //     return next(new AppError("User recently changed password! Please log in again.", 401));
        // }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser; // Attach user to the request object
        res.locals.user = currentUser; // Also make available in templates if needed
        next();
    } catch (error) {
         if (error.name === "JsonWebTokenError") {
            return next(new AppError("Invalid token. Please log in again!", 401));
        } else if (error.name === "TokenExpiredError") {
            return next(new AppError("Your token has expired! Please log in again.", 401));
        }
        // Forward other errors to the global error handler
        next(new AppError("Authentication failed.", 401));
    }
};

// Restrict Routes Middleware (Role-based access control)
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user is set by the 'protect' middleware
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action", 403)); // 403 Forbidden
        }
        next();
    };
};
