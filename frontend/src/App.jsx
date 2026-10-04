import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 
/*our project uses React Router for navigation between pages.

These four things have different jobs:
BrowserRouter: -Provides routing functionality to your application.
Routes:- Acts as a container for your routes.
Route: -Defines an individual URL and what component should appear there.
Navigate:- Used to redirect the user to another URL.
*/
// Global Theme & Dashboard Styles
import "./theme.css";
import "./dashboard.css";

// Components
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute"; // for restricted access to dashboard 

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter> {/*to enable routing in the application*/ } 
      <Navbar /> {/*to display the navigation bar on all pages*/}
      <Routes>  {/*to define the different routes in the application*/}
        {/* Public Landing & Auth Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Role-Based Protected Dashboards */}
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute allowedRoles={["patient", "admin"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hospital-dashboard"
          element={
            <ProtectedRoute allowedRoles={["hospital", "admin"]}>
              <HospitalDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/driver-dashboard"
          element={
            <ProtectedRoute allowedRoles={["driver", "admin"]}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
