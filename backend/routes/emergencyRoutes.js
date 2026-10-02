const express = require("express");

const {
  createEmergency,
  getAllEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  acceptAndAssignAmbulance,
  assignAmbulance,
  cancelEmergency,
} = require("../Controllers/emergencyController");

const router = express.Router();

// Create emergency
router.post("/", createEmergency);

// Get emergencies
router.get("/", getAllEmergencies);

// Get single emergency
router.get("/:id", getEmergencyById);

// Accept emergency + automatically assign ambulance
router.put(
  "/:id/accept-and-assign",
  acceptAndAssignAmbulance
);

// Update emergency status
router.put("/:id/status", updateEmergencyStatus);

// Manually assign ambulance
router.put("/:id/assign-ambulance", assignAmbulance);

// Cancel emergency
router.put("/:id/cancel", cancelEmergency);

module.exports = router;

