const express = require("express");

const {
  getAmbulance,
  updateAmbulanceStatus,
  updateAmbulanceLocation,
} = require("../controllers/ambulanceController");

const router = express.Router();

// Get ambulance details
router.get("/:id", getAmbulance);

// Update ambulance availability/status
router.put("/:id/status", updateAmbulanceStatus);

// Update ambulance location
router.put("/:id/location", updateAmbulanceLocation);

module.exports = router;
