const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "lifeline_connect_secret_2026",
      );

      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res.status(401).json({
          message: "Not authorized, user not found or deleted",
        });
      }

      if (req.user.isActive === false) {
        return res.status(403).json({
          message: "Account has been deactivated",
        });
      }

      return next();
    } catch (error) {
      console.error("JWT verification error in protect middleware:", error.message);
      return res.status(401).json({
        message: "Not authorized, token failed or expired",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: "Not authorized, no token provided",
    });
  }
};

// Admin only restriction
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({
    message: "Access denied: Administrator privilege required",
  });
};

module.exports = {
  protect,
  adminOnly,
};
