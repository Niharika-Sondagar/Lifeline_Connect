const express = require("express");

const {
  getAmbulance,
  updateAmbulanceStatus,
  updateAmbulanceLocation,
  getAllAmbulances,
  createAmbulance,
} = require("../Controllers/ambulanceController");

const router = express.Router();

// Get all ambulances (with optional ?hospital=&driver=&status=)
router.get("/", getAllAmbulances);

// Create / register ambulance
router.post("/", createAmbulance);

// Get ambulance details
router.get("/:id", getAmbulance);

// Update ambulance availability/status
router.put("/:id/status", updateAmbulanceStatus);

// Update ambulance location
router.put("/:id/location", updateAmbulanceLocation);

module.exports = router;
