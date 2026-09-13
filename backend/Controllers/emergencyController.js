const EmergencyRequest = require("../models/EmergencyRequest");
const Ambulance = require("../models/Ambulance");


// ===============================
// CREATE EMERGENCY REQUEST
// ===============================
const createEmergency = async (req, res) => {
    try {
        const {
            patient,
            hospital,
            emergencyType,
            description,
            patientLocation
        } = req.body;

        // Required fields
        if (
            !patient ||
            !emergencyType ||
            !patientLocation ||
            !patientLocation.coordinates
        ) {
            return res.status(400).json({
                message: "Patient, emergency type and location are required"
            });
        }

        const emergency = await EmergencyRequest.create({
            patient,
            hospital: hospital || null,
            emergencyType,
            description,
            patientLocation: {
                type: "Point",
                coordinates: patientLocation.coordinates
            }
        });

        res.status(201).json({
            message: "Emergency request created successfully",
            emergency
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
// GET ALL EMERGENCIES
// ===============================
const getAllEmergencies = async (req, res) => {
    try {
        const emergencies = await EmergencyRequest.find()
            .populate("patient", "-password")
            .populate("hospital")
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


// ===============================
// GET EMERGENCY BY ID
// ===============================
const getEmergencyById = async (req, res) => {
    try {
        const emergency = await EmergencyRequest.findById(req.params.id)
            .populate("patient", "-password")
            .populate("hospital")
            .populate("ambulance")
            .populate("driver", "-password");

        if (!emergency) {
            return res.status(404).json({
                message: "Emergency request not found"
            });
        }

        res.status(200).json(emergency);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ===============================
// UPDATE EMERGENCY STATUS
// ===============================
const updateEmergencyStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = [
            "pending",
            "accepted",
            "rejected",
            "ambulance_assigned",
            "on_the_way",
            "reached_patient",
            "completed",
            "cancelled"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid emergency status"
            });
        }

        const emergency = await EmergencyRequest.findById(
            req.params.id
        );

        if (!emergency) {
            return res.status(404).json({
                message: "Emergency request not found"
            });
        }

        emergency.status = status;

        // Store timestamps for important events

        if (status === "accepted") {
            emergency.acceptedAt = new Date();
        }

        if (status === "ambulance_assigned") {
            emergency.dispatchedAt = new Date();
        }

        if (status === "completed") {
            emergency.completedAt = new Date();
        }

        await emergency.save();

        res.status(200).json({
            message: "Emergency status updated successfully",
            emergency
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
// ASSIGN AMBULANCE
// ===============================
const assignAmbulance = async (req, res) => {
    try {
        const { ambulanceId } = req.body;

        if (!ambulanceId) {
            return res.status(400).json({
                message: "Ambulance ID is required"
            });
        }

        const emergency = await EmergencyRequest.findById(
            req.params.id
        );

        if (!emergency) {
            return res.status(404).json({
                message: "Emergency request not found"
            });
        }

        const ambulance = await Ambulance.findById(ambulanceId)
            .populate("driver", "-password");

        if (!ambulance) {
            return res.status(404).json({
                message: "Ambulance not found"
            });
        }

        // Check ambulance availability
        if (ambulance.status !== "available") {
            return res.status(400).json({
                message: "Ambulance is not available"
            });
        }

        // Check driver
        if (!ambulance.driver) {
            return res.status(400).json({
                message: "No driver assigned to this ambulance"
            });
        }

        // Assign ambulance
        emergency.ambulance = ambulance._id;

        // Assign driver
        emergency.driver = ambulance.driver._id;

        // Update emergency status
        emergency.status = "ambulance_assigned";
        emergency.dispatchedAt = new Date();

        // Update ambulance status
        ambulance.status = "assigned";

        await emergency.save();
        await ambulance.save();

        const updatedEmergency = await EmergencyRequest.findById(
            emergency._id
        )
            .populate("patient", "-password")
            .populate("hospital")
            .populate("ambulance")
            .populate("driver", "-password");

        res.status(200).json({
            message: "Ambulance assigned successfully",
            emergency: updatedEmergency
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
// CANCEL EMERGENCY
// ===============================
const cancelEmergency = async (req, res) => {
    try {
        const emergency = await EmergencyRequest.findById(
            req.params.id
        );

        if (!emergency) {
            return res.status(404).json({
                message: "Emergency request not found"
            });
        }

        // Don't allow cancellation after trip has started
        if (
            emergency.status === "on_the_way" ||
            emergency.status === "reached_patient" ||
            emergency.status === "completed"
        ) {
            return res.status(400).json({
                message: "Emergency cannot be cancelled at this stage"
            });
        }

        emergency.status = "cancelled";

        // If ambulance was already assigned,
        // make it available again
        if (emergency.ambulance) {
            await Ambulance.findByIdAndUpdate(
                emergency.ambulance,
                {
                    status: "available"
                }
            );
        }

        await emergency.save();

        res.status(200).json({
            message: "Emergency cancelled successfully",
            emergency
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
    createEmergency,
    getAllEmergencies,
    getEmergencyById,
    updateEmergencyStatus,
    assignAmbulance,
    cancelEmergency
};