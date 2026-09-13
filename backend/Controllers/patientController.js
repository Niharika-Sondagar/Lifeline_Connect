const User = require("../models/User");


// ===============================
// GET PATIENT PROFILE
// ===============================
const getPatientProfile = async (req, res) => {
    try {
        const patient = await User.findById(req.params.id)
            .select("-password");

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        if (patient.role !== "patient") {
            return res.status(400).json({
                message: "User is not a patient"
            });
        }

        res.status(200).json(patient);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};


// ===============================
// UPDATE PATIENT PROFILE
// ===============================
const updatePatientProfile = async (req, res) => {
    try {
        const {
            name,
            phone,
            address,
            emergencyContact
        } = req.body;

        const patient = await User.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found"
            });
        }

        if (patient.role !== "patient") {
            return res.status(400).json({
                message: "User is not a patient"
            });
        }

        // Update fields
        if (name) patient.name = name;
        if (phone) patient.phone = phone;
        if (address) patient.address = address;

        if (emergencyContact) {
            patient.emergencyContact = emergencyContact;
        }

        await patient.save();

        res.status(200).json({
            message: "Patient profile updated successfully",
            patient: {
                id: patient._id,
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                address: patient.address,
                emergencyContact: patient.emergencyContact
            }
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
    getPatientProfile,
    updatePatientProfile
};