const express = require("express");

const {
  getHospitalProfile,
  updateHospitalProfile,
  getEmergencyRequests,
  getAllHospitals,
} = require("../Controllers/hospitalController");

const router = express.Router();

// Get all hospitals
router.get("/", getAllHospitals);

// Get hospital profile
router.get("/profile/:id", getHospitalProfile);

// Update hospital profile
router.put("/profile/:id", updateHospitalProfile);

// Get emergency requests received by hospital
router.get("/emergencies", getEmergencyRequests);

module.exports = router;
