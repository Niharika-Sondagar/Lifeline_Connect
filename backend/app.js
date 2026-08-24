const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const ambulanceRoutes = require("./routes/ambulanceRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
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
