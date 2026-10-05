const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    emergency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmergencyRequest",
      default: null,
    },

    recipientName: {
      type: String,
      trim: true,
      default: "",
    },

    recipientPhone: {
      type: String,
      required: true,
      trim: true,
    },

    relation: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: ["sms", "email", "push"],
      default: "sms",
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["sent", "failed", "simulated", "skipped"],
      default: "sent",
    },

    provider: {
      type: String,
      default: "twilio",
    },

    providerMessageId: {
      type: String,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", notificationSchema);
