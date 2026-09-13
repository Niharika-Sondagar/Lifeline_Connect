const Hospital = require("../models/Hospital");
const EmergencyRequest = require("../models/EmergencyRequest");


// ===============================
// GET HOSPITAL PROFILE
// ===============================
const getHospitalProfile = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id)
            .populate("user", "-password");

        if (!hospital) {
            return res.status(404).json({
                message: "Hospital not found"
            });
        }

        res.status(200).json(hospital);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ===============================
// UPDATE HOSPITAL PROFILE
// ===============================
const updateHospitalProfile = async (req, res) => {
    try {
        const {
            name,
            address,
            phone,
            location
        } = req.body;

        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).json({
                message: "Hospital not found"
            });
        }

        if (name) hospital.name = name;
        if (address) hospital.address = address;
        if (phone) hospital.phone = phone;

        if (location) {
            hospital.location = location;
        }

        await hospital.save();

        res.status(200).json({
            message: "Hospital profile updated successfully",
            hospital
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
// GET EMERGENCY REQUESTS
// ===============================
const getEmergencyRequests = async (req, res) => {
    try {
        // Hospital ID can be passed as query
        // Example:
        // /api/hospitals/emergencies?hospitalId=123

        const { hospitalId } = req.query;

        if (!hospitalId) {
            return res.status(400).json({
                message: "hospitalId is required"
            });
        }

        const emergencies = await EmergencyRequest.find({
            hospital: hospitalId
        })
            .populate("patient", "-password")
            .populate("ambulance")
            .populate("driver", "-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: emergencies.length,
            emergencies
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
    getHospitalProfile,
    updateHospitalProfile,
    getEmergencyRequests
};  