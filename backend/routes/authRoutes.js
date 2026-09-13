const express = require("express");

const { register, login } = require("../Controllers/authController");

const router = express.Router();

// Register user
router.post("/register", register);

// Login user
router.post("/login", login);

module.exports = router;
