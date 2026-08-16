const mongoose = require("mongoose");

const emergencyRequestSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        hospital: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
            default: null
        },

        ambulance: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ambulance",
            default: null
        },

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        emergencyType: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        patientLocation: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },

            coordinates: {
                type: [Number],
                required: true
            }
        },

        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "rejected",
                "ambulance_assigned",
                "on_the_way",
                "reached_patient",
                "completed",
                "cancelled"
            ],
            default: "pending"
        },

        requestedAt: {
            type: Date,
            default: Date.now
        },

        acceptedAt: {
            type: Date,
            default: null
        },

        dispatchedAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

emergencyRequestSchema.index({
    patientLocation: "2dsphere"
});

module.exports = mongoose.model(
    "EmergencyRequest",
    emergencyRequestSchema
);