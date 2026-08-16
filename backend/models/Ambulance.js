const mongoose = require("mongoose");

const ambulanceSchema = new mongoose.Schema(
    {
        vehicleNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        hospital: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        status: {
            type: String,
            enum: [
                "available",
                "assigned",
                "on_the_way",
                "busy",
                "maintenance"
            ],
            default: "available"
        },

        currentLocation: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },

            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        }
    },
    {
        timestamps: true
    }
);

ambulanceSchema.index({
    currentLocation: "2dsphere"
});

module.exports = mongoose.model("Ambulance", ambulanceSchema);