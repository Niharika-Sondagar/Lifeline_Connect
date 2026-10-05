const EmergencyRequest = require("../models/EmergencyRequest");
const Ambulance = require("../models/Ambulance");
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const { sendEmergencySms } = require("../services/smsService");

// ============================================================
// CREATE EMERGENCY REQUEST
// ============================================================
const createEmergency = async (req, res) => {
  try {
    const {
      patient,
      hospital,
      emergencyType,
      description,
      patientLocation,
      emergencyContact,
    } = req.body;

    if (
      !patient ||
      !emergencyType ||
      !patientLocation ||
      !patientLocation.coordinates
    ) {
      return res.status(400).json({
        message: "Patient, emergency type and location are required",
      });
    }

    // Look up the patient to obtain profile info and registered emergency contact
    const patientUser = await User.findById(patient);

    // Determine the emergency contact (either explicitly passed or from patient user document)
    const activeEmergencyContact =
      emergencyContact ||
      (patientUser?.emergencyContact && patientUser.emergencyContact.phone
        ? {
            name: patientUser.emergencyContact.name || "",
            phone: patientUser.emergencyContact.phone || "",
            relation: patientUser.emergencyContact.relation || "",
          }
        : null);

    // Look up hospital name if a hospital was selected
    let hospitalName = "";
    if (hospital) {
      try {
        const hospDoc = await Hospital.findById(hospital);
        if (hospDoc) hospitalName = hospDoc.name;
      } catch (_) {}
    }

    // Create the emergency request
    const emergency = await EmergencyRequest.create({
      patient,
      hospital: hospital || null,
      emergencyType,
      description,
      patientLocation: {
        type: "Point",
        coordinates: patientLocation.coordinates,
      },
      emergencyContact: activeEmergencyContact || undefined,
    });

    // Send SMS notification to emergency contact
    let smsNotification = {
      sent: false,
      status: "skipped",
      reason: "No emergency contact phone registered for this patient",
    };

    if (activeEmergencyContact && activeEmergencyContact.phone) {
      try {
        const smsResult = await sendEmergencySms({
          patientUser,
          emergency,
          emergencyContact: activeEmergencyContact,
          hospitalName,
          coordinates: patientLocation.coordinates,
        });

        smsNotification = smsResult;

        // Persist notification status directly on the emergency record
        emergency.smsNotification = {
          sent: smsResult.sent || false,
          status: smsResult.status || "not_sent",
          phone: smsResult.phone || activeEmergencyContact.phone,
          recipientName: smsResult.recipientName || activeEmergencyContact.name,
          messageSid: smsResult.messageSid || null,
          sentAt: smsResult.sentAt || new Date(),
          error: smsResult.error || null,
        };
        await emergency.save();
      } catch (smsError) {
        console.error("SMS notification dispatch failed:", smsError);
        smsNotification = {
          sent: false,
          status: "failed",
          error: smsError.message,
        };
      }
    } else {
      console.warn("⚠️ No emergency contact phone registered for patient:", patient);
    }

    // Populate patient and hospital for consistent frontend response
    const populatedEmergency = await EmergencyRequest.findById(emergency._id)
      .populate("patient", "-password")
      .populate("hospital");

    res.status(201).json({
      message: "Emergency request created successfully",
      emergency: populatedEmergency || emergency,
      smsNotification,
    });
  } catch (error) {
    console.error("CREATE EMERGENCY ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL EMERGENCIES
// ============================================================
const getAllEmergencies = async (req, res) => {
  try {
    const filter = {};

    if (req.query.patient) {
      filter.patient = req.query.patient;
    }

    if (req.query.hospital) {
      filter.hospital = req.query.hospital;
    }

    if (req.query.driver) {
      filter.driver = req.query.driver;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const emergencies = await EmergencyRequest.find(filter)
      .populate("patient", "-password")
      .populate("hospital")
      .populate({
        path: "ambulance",
        populate: { path: "driver", select: "-password" },
      })
      .populate("driver", "-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: emergencies.length,
      emergencies,
    });
  } catch (error) {
    console.error("GET EMERGENCIES ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================================
// GET EMERGENCY BY ID
// ============================================================
const getEmergencyById = async (req, res) => {
  try {
    const emergency = await EmergencyRequest.findById(req.params.id)
      .populate("patient", "-password")
      .populate("hospital")
      .populate({
        path: "ambulance",
        populate: { path: "driver", select: "-password" },
      })
      .populate("driver", "-password");

    if (!emergency) {
      return res.status(404).json({
        message: "Emergency request not found",
      });
    }

    res.status(200).json(emergency);
  } catch (error) {
    console.error("GET EMERGENCY ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE EMERGENCY STATUS
// ============================================================
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
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid emergency status",
      });
    }

    const emergency = await EmergencyRequest.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        message: "Emergency request not found",
      });
    }

    emergency.status = status;

    if (req.body.hospitalId && !emergency.hospital) {
      emergency.hospital = req.body.hospitalId;
    }

    if (status === "accepted") {
      emergency.acceptedAt = new Date();
    }

    if (status === "ambulance_assigned") {
      emergency.dispatchedAt = new Date();
    }

    if (status === "completed") {
      emergency.completedAt = new Date();
      if (emergency.ambulance) {
        await Ambulance.findByIdAndUpdate(emergency.ambulance, {
          status: "available",
        });
      }
    }

    await emergency.save();

    const updatedEmergency = await EmergencyRequest.findById(emergency._id)
      .populate("patient", "-password")
      .populate("hospital")
      .populate({
        path: "ambulance",
        populate: { path: "driver", select: "-password" },
      })
      .populate("driver", "-password");

    res.status(200).json({
      message: "Emergency status updated successfully",
      emergency: updatedEmergency,
    });
  } catch (error) {
    console.error("UPDATE EMERGENCY STATUS ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================================
// ACCEPT EMERGENCY + AUTOMATICALLY ASSIGN AMBULANCE
// ============================================================
const acceptAndAssignAmbulance = async (req, res) => {
  try {
    const emergency = await EmergencyRequest.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        message: "Emergency request not found",
      });
    }

    // Attach hospital from body if emergency had no hospital assigned yet
    if (req.body.hospitalId && !emergency.hospital) {
      emergency.hospital = req.body.hospitalId;
    }

    // Prevent assigning another ambulance to an already assigned emergency
    if (emergency.ambulance && emergency.status !== "pending" && emergency.status !== "accepted") {
      const existingEmergency = await EmergencyRequest.findById(
        emergency._id
      )
        .populate("patient", "-password")
        .populate("hospital")
        .populate({
          path: "ambulance",
          populate: { path: "driver", select: "-password" },
        })
        .populate("driver", "-password");

      return res.status(200).json({
        message: "Emergency already has an ambulance assigned",
        emergency: existingEmergency,
      });
    }

    // --------------------------------------------------------
    // STEP 1: Mark emergency as accepted
    // --------------------------------------------------------
    emergency.status = "accepted";
    emergency.acceptedAt = new Date();

    // --------------------------------------------------------
    // STEP 2: Find an available ambulance
    // --------------------------------------------------------
    let ambulance = null;

    // Prefer ambulance belonging to this hospital
    if (emergency.hospital) {
      ambulance = await Ambulance.findOne({
        hospital: emergency.hospital,
        status: "available",
      })
        .sort({ createdAt: 1 })
        .populate("driver", "-password");
    }

    // If no ambulance for that hospital, try any available ambulance in fleet
    if (!ambulance) {
      ambulance = await Ambulance.findOne({
        status: "available",
      })
        .sort({ createdAt: 1 })
        .populate("driver", "-password");
    }

    // If still no available ambulance, automatically create/allocate an emergency ambulance
    if (!ambulance) {
      const Hospital = require("../models/Hospital");
      const hospitalDoc = emergency.hospital
        ? await Hospital.findById(emergency.hospital)
        : await Hospital.findOne();

      const hospCode = hospitalDoc?.name
        ? hospitalDoc.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase()
        : "EMG";
      const vehicleNum = `GJ-01-${hospCode}-${Math.floor(1000 + Math.random() * 9000)}`;

      let defaultDriver = await User.findOne({ role: "driver" });
      if (!defaultDriver) {
        const bcrypt = require("bcryptjs");
        const defaultPassword = await bcrypt.hash("driver123", 10);
        defaultDriver = await User.create({
          name: "Emergency Paramedic Driver",
          email: `driver_${Date.now()}@lifeline.org`,
          password: defaultPassword,
          phone: "108-555-0199",
          role: "driver",
        });
      }

      const defaultCoords = hospitalDoc?.location?.coordinates ||
        (emergency.patientLocation?.coordinates
          ? [emergency.patientLocation.coordinates[0] + 0.008, emergency.patientLocation.coordinates[1] + 0.008]
          : [72.5714, 23.0225]);

      ambulance = await Ambulance.create({
        vehicleNumber: vehicleNum,
        hospital: emergency.hospital || (hospitalDoc ? hospitalDoc._id : null),
        driver: defaultDriver ? defaultDriver._id : null,
        status: "available",
        currentLocation: {
          type: "Point",
          coordinates: defaultCoords,
        },
      });

      ambulance = await Ambulance.findById(ambulance._id).populate("driver", "-password");
    }

    // --------------------------------------------------------
    // STEP 3: Find / assign driver
    // --------------------------------------------------------
    let driverId = ambulance.driver
      ? (ambulance.driver._id || ambulance.driver)
      : null;

    if (!driverId) {
      const driver = await User.findOne({
        role: "driver",
      }).sort({ createdAt: 1 });

      if (driver) {
        driverId = driver._id;
        ambulance.driver = driver._id;
      }
    }

    // --------------------------------------------------------
    // STEP 4: Attach ambulance to emergency
    // --------------------------------------------------------
    emergency.ambulance = ambulance._id;

    if (!emergency.hospital && ambulance.hospital) {
      emergency.hospital = ambulance.hospital;
    }

    emergency.driver = driverId || null;
    emergency.status = "ambulance_assigned";
    emergency.dispatchedAt = new Date();

    // --------------------------------------------------------
    // STEP 5: Mark ambulance as assigned
    // --------------------------------------------------------
    ambulance.status = "assigned";

    await emergency.save();
    await ambulance.save();

    // --------------------------------------------------------
    // STEP 6: Return fully populated emergency
    // --------------------------------------------------------
    const updatedEmergency = await EmergencyRequest.findById(
      emergency._id
    )
      .populate("patient", "-password")
      .populate("hospital")
      .populate({
        path: "ambulance",
        populate: { path: "driver", select: "-password" },
      })
      .populate("driver", "-password");

    res.status(200).json({
      message: "Emergency accepted and ambulance assigned successfully",
      emergency: updatedEmergency,
    });
  } catch (error) {
    console.error(
      "ACCEPT + ASSIGN AMBULANCE ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================================
// MANUAL ASSIGN AMBULANCE
// ============================================================
const assignAmbulance = async (req, res) => {
  try {
    const { ambulanceId } = req.body;

    if (!ambulanceId) {
      return res.status(400).json({
        message: "Ambulance ID is required",
      });
    }

    const emergency = await EmergencyRequest.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({
        message: "Emergency request not found",
      });
    }

    const ambulance = await Ambulance.findById(
      ambulanceId
    ).populate("driver", "-password");

    if (!ambulance) {
      return res.status(404).json({
        message: "Ambulance not found",
      });
    }

    if (ambulance.status !== "available") {
      return res.status(400).json({
        message: "Ambulance is not available",
      });
    }

    let driverId = ambulance.driver
      ? ambulance.driver._id
      : null;

    if (!driverId && req.body.driverId) {
      driverId = req.body.driverId;
      ambulance.driver = driverId;
    }

    if (!driverId) {
      const defaultDriver = await User.findOne({
        role: "driver",
      });

      if (defaultDriver) {
        driverId = defaultDriver._id;
        ambulance.driver = defaultDriver._id;
      }
    }

    emergency.ambulance = ambulance._id;

    if (!emergency.hospital && ambulance.hospital) {
      emergency.hospital = ambulance.hospital;
    }

    emergency.driver = driverId || null;
    emergency.status = "ambulance_assigned";
    emergency.dispatchedAt = new Date();

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
      emergency: updatedEmergency,
    });
  } catch (error) {
    console.error("ASSIGN AMBULANCE ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ============================================================
// CANCEL EMERGENCY
// ============================================================
const cancelEmergency = async (req, res) => {
  try {
    const emergency = await EmergencyRequest.findById(
      req.params.id
    );

    if (!emergency) {
      return res.status(404).json({
        message: "Emergency request not found",
      });
    }

    if (
      emergency.status === "on_the_way" ||
      emergency.status === "reached_patient" ||
      emergency.status === "completed"
    ) {
      return res.status(400).json({
        message: "Emergency cannot be cancelled at this stage",
      });
    }

    emergency.status = "cancelled";

    if (emergency.ambulance) {
      await Ambulance.findByIdAndUpdate(
        emergency.ambulance,
        {
          status: "available",
        }
      );
    }

    await emergency.save();

    res.status(200).json({
      message: "Emergency cancelled successfully",
      emergency,
    });
  } catch (error) {
    console.error("CANCEL EMERGENCY ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createEmergency,
  getAllEmergencies,
  getEmergencyById,
  updateEmergencyStatus,
  acceptAndAssignAmbulance,
  assignAmbulance,
  cancelEmergency,
};

