const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { promisify } = require("util"); 

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    user.password = undefined;



    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

exports.register = async (req, res, next) => {
    try {
        const { username, email, password, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ status: "fail", message: "Please provide username, email, and password" });
        }


        const newUserRole = (role && role === 'admin') ? 'admin' : 'student';   

        const newUser = await User.create({
            username,
            email,
            password,
            role: newUserRole, 
        });

        createSendToken(newUser, 201, res);
    } catch (error) {
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

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: "fail", message: "Please provide email and password!" });
        }

        const user = await User.findOne({ email }).select("+password"); 

        if (!user || !(await user.comparePassword(password, user.password))) {
            return res.status(401).json({ status: "fail", message: "Incorrect email or password" });
        }

        createSendToken(user, 200, res);
    } catch (error) {
        res.status(500).json({ status: "error", message: "Login failed", error: error.message });
    }
};

exports.protect = async (req, res, next) => {
    try {
        let token;
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ status: "fail", message: "You are not logged in! Please log in to get access." });
        }

        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ status: "fail", message: "The user belonging to this token does no longer exist." });
        }

        req.user = currentUser; 
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

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: "fail", message: "You do not have permission to perform this action" });
        }
        next();
    };
};
