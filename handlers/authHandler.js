const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { promisify } = require("util"); // To promisify jwt.verify

// Utility function to sign JWT token
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// Utility function to create and send token
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Remove password from output
    user.password = undefined;

    // Send token via cookie (optional, but good practice for web apps)
    // res.cookie('jwt', token, {
    //     expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    //     httpOnly: true, // Prevent XSS attacks
    //     secure: process.env.NODE_ENV === 'production' // Only send over HTTPS
    // });

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

// Registration Handler
exports.register = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).json({ status: "fail", message: "Please provide username, email, and password" });
        }

        // Ensure role is not manually set to admin during registration if not intended
        // Only allow 'student' role during public registration
        const newUserRole = (role && role === 'admin') ? 'admin' : 'student'; // Or restrict completely

        const newUser = await User.create({
            username,
            email,
            password,
            role: newUserRole, // Use controlled role
        });

        createSendToken(newUser, 201, res);
    } catch (error) {
        // Handle duplicate email/username errors, etc.
        if (error.code === 11000) {
             return res.status(400).json({ status: "fail", message: `Duplicate field value: ${Object.keys(error.keyValue)[0]}. Please use another value!` });
        }
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            const message = `Invalid input data. ${errors.join('. ')}`;
            return res.status(400).json({ status: "fail", message });
        }
        res.status(500).json({ status: "error", message: "Registration failed", error: error.message });
    }
};

// Login Handler
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1) Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({ status: "fail", message: "Please provide email and password!" });
        }

        // 2) Check if user exists && password is correct
        const user = await User.findOne({ email }).select("+password"); // Explicitly select password

        if (!user || !(await user.comparePassword(password, user.password))) {
            return res.status(401).json({ status: "fail", message: "Incorrect email or password" });
        }

        // 3) If everything ok, send token to client
        createSendToken(user, 200, res);
    } catch (error) {
        res.status(500).json({ status: "error", message: "Login failed", error: error.message });
    }
};

// Protect Routes Middleware (will be moved to middleware folder later, but defined here for context)
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
            return res.status(401).json({ status: "fail", message: "You are not logged in! Please log in to get access." });
        }

        // 2) Verification token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ status: "fail", message: "The user belonging to this token does no longer exist." });
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser; // Attach user to the request object
        next();
    } catch (error) {
         if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: "fail", message: "Invalid token. Please log in again!" });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ status: "fail", message: "Your token has expired! Please log in again." });
        }
        res.status(401).json({ status: "fail", message: "Authentication failed", error: error.message });
    }
};

// Restrict Routes Middleware (will be moved to middleware folder later)
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'lead-guide']. role='user'
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: "fail", message: "You do not have permission to perform this action" });
        }
        next();
    };
};
