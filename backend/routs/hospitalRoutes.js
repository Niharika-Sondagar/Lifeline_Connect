const express = require("express");

const {
  getHospitalProfile,
  updateHospitalProfile,
  getEmergencyRequests,
} = require("../controllers/hospitalController");

const router = express.Router();

// Get hospital profile
router.get("/profile/:id", getHospitalProfile);

// Update hospital profile
router.put("/profile/:id", updateHospitalProfile);

// Get emergency requests received by hospital
router.get("/emergencies", getEmergencyRequests);

module.exports = router;
