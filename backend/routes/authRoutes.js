const express = require("express");

const { register, login, checkAdminExists } = require("../Controllers/authController");

const router = express.Router();

// Register user
router.post("/register", register);

// Login user
router.post("/login", login);

// Check if an admin already exists in the system
router.get("/admin-exists", checkAdminExists);

module.exports = router;
