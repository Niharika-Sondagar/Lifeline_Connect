const express = require("express");

const {
  getPatientProfile,
  updatePatientProfile,
} = require("../Controllers/patientController");

const router = express.Router();

// Get patient profile
router.get("/profile/:id", getPatientProfile);

// Update patient profile
router.put("/profile/:id", updatePatientProfile);

module.exports = router;
