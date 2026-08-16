const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        role: {
            type: String,
            enum: ["patient", "hospital", "driver", "admin"],
            required: true
        },

        address: {
            type: String,
            trim: true
        },

        emergencyContact: {
            name: {
                type: String,
                trim: true
            },

            phone: {
                type: String,
                trim: true
            },

            relation: {
                type: String,
                trim: true
            }
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);