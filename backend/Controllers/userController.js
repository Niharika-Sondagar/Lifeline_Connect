const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Ambulance = require("../models/Ambulance");
const EmergencyRequest = require("../models/EmergencyRequest");

// ===============================
// GET ALL USERS (with optional role & search filtering)
// ===============================
const getAllUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};

    if (role && role !== "all") {
      query.role = role.toLowerCase();
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } },
        { role: { $regex: term, $options: "i" } },
        { address: { $regex: term, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

// ===============================
// GET SINGLE USER BY ID
// ===============================
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({
      message: "Server error while fetching user",
      error: error.message,
    });
  }
};

// ===============================
// DELETE USER
// ===============================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Guard: Prevent admin from deleting their own currently logged-in account
    if (req.user && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({
        message: "You cannot delete the currently logged-in administrator account.",
      });
    }

    // Guard: Prevent deleting the last remaining admin in the system
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Action prohibited: Cannot delete the last remaining administrator.",
        });
      }
    }

    // Cascade cleanup associated collections based on user role
    if (user.role === "hospital") {
      const hospitals = await Hospital.find({ user: user._id });
      const hospitalIds = hospitals.map((h) => h._id);

      // Clean up linked ambulances and emergencies
      if (hospitalIds.length > 0) {
        await Ambulance.deleteMany({ hospital: { $in: hospitalIds } });
        await EmergencyRequest.deleteMany({ hospital: { $in: hospitalIds } });
      }

      await Hospital.deleteMany({ user: user._id });
    } else if (user.role === "driver") {
      // Unassign driver from ambulances and make ambulances available
      await Ambulance.updateMany(
        { driver: user._id },
        { $set: { driver: null, status: "available" } },
      );
      // Unassign driver from any active emergencies
      await EmergencyRequest.updateMany(
        { driver: user._id },
        { $set: { driver: null } },
      );
    } else if (user.role === "patient") {
      // Remove emergency records created by this patient
      await EmergencyRequest.deleteMany({ patient: user._id });
    }

    // Delete the user record
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `User ${user.name || user.email} deleted successfully`,
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({
      message: "Server error while deleting user",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  deleteUser,
};
