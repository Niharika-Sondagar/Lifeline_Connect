const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./backend/config/db");

const authRoutes = require("./backend/routes/authRoutes");
const patientRoutes = require("./backend/routes/patientRoutes");
const hospitalRoutes = require("./backend/routes/hospitalRoutes");
const ambulanceRoutes = require("./backend/routes/ambulanceRoutes");
const emergencyRoutes = require("./backend/routes/emergencyRoutes");

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

app.get("/", (req, res) => {
  res.send("Hospital Emergency Management API is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
