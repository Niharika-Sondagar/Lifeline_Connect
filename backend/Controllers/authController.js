const User = require("../models/User");
const Hospital = require("../models/Hospital");
const bcrypt = require("bcryptjs"); //hash password
const jwt = require("jsonwebtoken"); //

// ===============================
// REGISTER USER
// ===============================
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role, address, emergencyContact } =
      req.body;

    // Check required fields
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    // Only one admin can exist in the system
    if (role === "admin") {
      const existingAdmin = await User.findOne({ role: "admin" });
      if (existingAdmin) {
        return res.status(400).json({
          message:
            "An administrator is already registered. Only one administrator can exist in the system.",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      address,
      emergencyContact,
    });
    let hospital = null;

    if (role === "hospital") {
      hospital = await Hospital.create({
        name,
        address,
        phone,
        location: {
          type: "Point", //Point defines this field must contain standard geoJson type
          coordinates: [72.5714, 23.0225],
        },
        user: user._id,
      });
    }
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        emergencyContact: user.emergencyContact,
      },
      hospital: hospital
        ? {
            id: hospital._id,
            name: hospital.name,
            address: hospital.address,
            phone: hospital.phone,
            location: hospital.location,
            isVerified: hospital.isVerified,
          }
        : null,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ===============================
// LOGIN USER
// ===============================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been blocked",
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    let hospital = null;
    let ambulance = null;

    if (user.role === "hospital") {
      hospital = await Hospital.findOne({ user: user._id });
    } else if (user.role === "driver") {
      const Ambulance = require("../models/Ambulance");
      ambulance = await Ambulance.findOne({ driver: user._id });
    }

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        emergencyContact: user.emergencyContact,
        hospitalId: hospital ? hospital._id : null,
        ambulanceId: ambulance ? ambulance._id : null,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ===============================
// CHECK IF ADMIN ALREADY EXISTS
// ===============================
const checkAdminExists = async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    res.status(200).json({
      adminExists: adminCount >= 1,
    });
  } catch (error) {
    console.error("Error in checkAdminExists:", error);
    res.status(500).json({
      adminExists: false,
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  checkAdminExists,
};
