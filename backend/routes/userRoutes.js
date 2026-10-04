const express = require("express");
const {
  getAllUsers,
  getUserById,
  deleteUser,
} = require("../Controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================
// GET ALL USERS (with optional ?role= & ?search=)
// GET /api/users
// ======================================
router.get("/", protect, adminOnly, getAllUsers);

// ======================================
// GET SINGLE USER BY ID
// GET /api/users/:id
// ======================================
router.get("/:id", protect, adminOnly, getUserById);

// ======================================
// DELETE USER
// DELETE /api/users/:id
// ======================================
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;
