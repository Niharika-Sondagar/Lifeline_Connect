const express = require("express"); // to create backend server and api's
const dotenv = require("dotenv"); // loads environment variables from a .env file into process.env
const cors = require("cors"); //
// Cross Origin resourse sharing
// It helps frontend and backend to communicate with each other even if they are on different ports or domains.

const connectDB = require("./backend/config/db");

const authRoutes = require("./backend/routes/authRoutes");
const patientRoutes = require("./backend/routes/patientRoutes");
const hospitalRoutes = require("./backend/routes/hospitalRoutes");
const ambulanceRoutes = require("./backend/routes/ambulanceRoutes");
const emergencyRoutes = require("./backend/routes/emergencyRoutes");
const locationRoutes = require("./backend/routes/locationRoutes");

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
app.use("/api/users", userRoutes);
app.get("/", (req, res) => {
  res.send("Hospital Emergency Management API is running");
}); // to check if backend is running or not, if running it will return this message in browser
//  or postman

const PORT = process.env.PORT || 5000; // to set the port number for the server to listen on,
// either from environment variable or default to 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
