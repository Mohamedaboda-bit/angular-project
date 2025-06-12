const express = require("express");
const authHandler = require("../handlers/authHandler");

const router = express.Router();

// Public routes
router.post("/register", authHandler.register);
router.post("/login", authHandler.login);

// Example of a protected route (can add more specific user routes here if needed)
// router.get("/me", authHandler.protect, (req, res) => {
//     res.status(200).json({ status: "success", data: { user: req.user } });
// });

module.exports = router;
