const express = require("express");

const {
  createEmergency,
  getAllEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  assignAmbulance,
  cancelEmergency,
} = require("../controllers/emergencyController");

const router = express.Router();

// Create emergency request
router.post("/", createEmergency);

// Get all emergency requests
router.get("/", getAllEmergencies);

// Get emergency request by ID
router.get("/:id", getEmergencyById);

// Update emergency status
router.put("/:id/status", updateEmergencyStatus);

// Assign ambulance to emergency
router.put("/:id/assign-ambulance", assignAmbulance);

// Cancel emergency
router.put("/:id/cancel", cancelEmergency);

module.exports = router;
