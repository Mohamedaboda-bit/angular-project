const express = require("express");
const authHandler = require("../handlers/authHandler");

const router = express.Router();

router.post("/register", authHandler.register);
router.post("/login", authHandler.login);

module.exports = router;
