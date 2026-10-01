const Ambulance = require("../models/Ambulance");

const updateAmbulanceLocation = async (req, res) => {
    try {
        const { ambulanceId, latitude, longitude } = req.body;

        if (
            ambulanceId === undefined ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                message: "Ambulance ID, latitude and longitude are required"
            });
        }

        const ambulance = await Ambulance.findById(ambulanceId);

        if (!ambulance) {
            return res.status(404).json({
                message: "Ambulance not found"
            });
        }

        ambulance.currentLocation = {
            type: "Point",
            coordinates: [longitude, latitude]
        };

        await ambulance.save();

        res.status(200).json({
            message: "Location updated successfully",
            location: ambulance.currentLocation
        });

    } catch (error) {
        res.status(500).json({
            message: "Error updating location",
            error: error.message
        });
    }
};

module.exports = {
    updateAmbulanceLocation
};