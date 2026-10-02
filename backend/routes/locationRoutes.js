const express = require("express");
const { updateAmbulanceLocation } = require("../Controllers/locationController");

const router = express.Router();

// Test location API
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Location API is working",
  });
});

// Update ambulance location
router.put("/ambulance", updateAmbulanceLocation);

module.exports = router;