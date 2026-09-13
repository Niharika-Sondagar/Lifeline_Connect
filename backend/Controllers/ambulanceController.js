const Ambulance = require("../models/Ambulance");


// ===============================
// GET AMBULANCE
// ===============================
const getAmbulance = async (req, res) => {
    try {
        const ambulance = await Ambulance.findById(req.params.id)
            .populate("hospital")
            .populate("driver", "-password");

        if (!ambulance) {
            return res.status(404).json({
                message: "Ambulance not found"
            });
        }

        res.status(200).json(ambulance);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ===============================
// UPDATE AMBULANCE STATUS
// ===============================
const updateAmbulanceStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = [
            "available",
            "assigned",
            "on_the_way",
            "busy",
            "maintenance"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid ambulance status"
            });
        }

        const ambulance = await Ambulance.findById(req.params.id);

        if (!ambulance) {
            return res.status(404).json({
                message: "Ambulance not found"
            });
        }

        ambulance.status = status;

        await ambulance.save();

        res.status(200).json({
            message: "Ambulance status updated successfully",
            ambulance
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ===============================
// UPDATE AMBULANCE LOCATION
// ===============================
const updateAmbulanceLocation = async (req, res) => {
    try {
        const {
            latitude,
            longitude
        } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                message: "Latitude and longitude are required"
            });
        }

        const ambulance = await Ambulance.findById(req.params.id);

        if (!ambulance) {
            return res.status(404).json({
                message: "Ambulance not found"
            });
        }

        // GeoJSON uses [longitude, latitude]
        ambulance.currentLocation = {
            type: "Point",
            coordinates: [
                longitude,
                latitude
            ]
        };

        await ambulance.save();

        res.status(200).json({
            message: "Ambulance location updated successfully",
            location: ambulance.currentLocation
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


module.exports = {
    getAmbulance,
    updateAmbulanceStatus,
    updateAmbulanceLocation
};