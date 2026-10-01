const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./backend/config/db");

const authRoutes = require("./backend/routs/authRoutes");
const patientRoutes = require("./backend/routs/patientRoutes");
const hospitalRoutes = require("./backend/routs/hospitalRoutes");
const ambulanceRoutes = require("./backend/routs/ambulanceRoutes");
const emergencyRoutes = require("./backend/routs/emergencyRoutes");
const locationRoutes = require("./backend/routs/locationRoutes");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/ambulances", ambulanceRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/location", locationRoutes);

app.get("/", (req, res) => {
  res.send("Hospital Emergency Management API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
