import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Ambulance,
  Activity,
  LogOut,
  ShieldAlert,
  User,
  Building2,
  Truck,
  LayoutDashboard,
} from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate(); // to navigate programmatically to different routes
  const location = useLocation();  // to get the current location object, which contains information about the current URL and navigation state

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardRoute = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "hospital":
        return "/hospital-dashboard";
      case "driver":
        return "/driver-dashboard";
      case "admin":
        return "/admin-dashboard";
      case "patient":
      default:
        return "/patient-dashboard";
    }
  };

  const getRoleIcon = () => {
    if (!user) return <User size={16} />;
    switch (user.role) {
      case "hospital":
        return <Building2 size={16} />;
      case "driver":
        return <Truck size={16} />;
      case "admin":
        return <Activity size={16} />;
      default:
        return <User size={16} />;
    }
  };

  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <Link to="/" className="nav-brand">
          <div className="brand-icon-box">
            <Ambulance size={22} />
          </div>
          <div className="brand-text">
            LifeLine <span>Connect</span>
          </div>
        </Link>

        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
          >
            Home
          </Link>

          {isAuthenticated && (
            <Link
              to={getDashboardRoute()}
              className={`nav-link ${location.pathname.includes("dashboard") ? "active" : ""}`}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}
        </nav>
      </div>

      <div className="nav-actions">
        {/* Quick SOS Trigger for Patients or Unauthenticated Visitors */}
        {(!isAuthenticated || user?.role === "patient") && (
          <Link to="/patient-dashboard" className="nav-sos-btn">
            <ShieldAlert size={18} className="animate-pulse-red" />
            <span>SOS Emergency</span>
          </Link>
        )}

        {isAuthenticated ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div className="user-badge">
              {getRoleIcon()}
              <span>{user?.name || "User"}</span>
              <span className={`role-tag ${user?.role || "patient"}`}>
                {user?.role || "patient"}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="logout-btn"
              title="Sign out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <Link
              to="/login"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="btn-primary"
              style={{ textDecoration: "none" }}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
