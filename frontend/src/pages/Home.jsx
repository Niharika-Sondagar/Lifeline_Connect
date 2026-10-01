import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldAlert,
  Ambulance,
  Building2,
  Truck,
  Activity,
  Clock,
  MapPin,
  PhoneCall,
  HeartHandshake,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  const getDashboardLink = () => {
    if (!user) return "/patient-dashboard";
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      {/* Hero Section */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
          color: "white",
          padding: "5rem 2rem 6rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "3rem",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "rgba(220, 38, 38, 0.2)",
                border: "1px solid rgba(220, 38, 38, 0.4)",
                padding: "0.4rem 1rem",
                borderRadius: "var(--radius-full)",
                color: "#fca5a5",
                fontSize: "0.85rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              <span
                className="radar-ping"
                style={{
                  position: "relative",
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#ef4444",
                  display: "inline-block",
                }}
              />
              24/7 Rapid Emergency Response Network
            </div>

            <h1
              style={{
                fontSize: "3.2rem",
                fontWeight: 900,
                lineHeight: 1.15,
                marginBottom: "1.5rem",
                letterSpacing: "-0.03em",
              }}
            >
              Minutes Matter in Emergencies.{" "}
              <span style={{ color: "#ef4444" }}>LifeLine Connect</span> Saves
              Lives.
            </h1>

            <p
              style={{
                fontSize: "1.15rem",
                color: "#cbd5e1",
                lineHeight: 1.6,
                marginBottom: "2.5rem",
                maxWidth: "600px",
              }}
            >
              Intelligent hospital & ambulance dispatch platform connecting
              critical patients with nearest medical facilities and emergency
              fleets in real time.
            </p>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Link
                to={isAuthenticated ? getDashboardLink() : "/patient-dashboard"}
                className="sos-trigger-btn"
                style={{ textDecoration: "none" }}
              >
                <ShieldAlert size={22} className="animate-pulse-red" />
                <span>Request Ambulance Now (SOS)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection / Portals */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "-3rem auto 4rem",
          padding: "0 1.5rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {/* Patient Card */}
          <div
            className="card"
            style={{ transition: "transform 0.2s", margin: 0 }}
          >
            <div className="card-body" style={{ padding: "1.75rem" }}>
              <div
                className="stat-icon-wrapper red"
                style={{ marginBottom: "1.25rem" }}
              >
                <ShieldAlert size={28} />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--navy)",
                  marginBottom: "0.5rem",
                }}
              >
                Patients & Citizens
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  marginBottom: "1.25rem",
                }}
              >
                Instant emergency booking, GPS pickup broadcast, and real-time
                ambulance tracking.
              </p>
              <Link
                to="/patient-dashboard"
                className="btn-primary"
                style={{
                  textDecoration: "none",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <span>Patient Portal</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Hospital Card */}
          <div
            className="card"
            style={{ transition: "transform 0.2s", margin: 0 }}
          >
            <div className="card-body" style={{ padding: "1.75rem" }}>
              <div
                className="stat-icon-wrapper blue"
                style={{ marginBottom: "1.25rem" }}
              >
                <Building2 size={28} />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--navy)",
                  marginBottom: "0.5rem",
                }}
              >
                Hospital Control
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  marginBottom: "1.25rem",
                }}
              >
                Manage emergency requests, assign available fleet ambulances,
                and prepare ER triage.
              </p>
              <Link
                to="/hospital-dashboard"
                className="btn-secondary"
                style={{
                  textDecoration: "none",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <span>Hospital Portal</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Driver Card */}
          <div
            className="card"
            style={{ transition: "transform 0.2s", margin: 0 }}
          >
            <div className="card-body" style={{ padding: "1.75rem" }}>
              <div
                className="stat-icon-wrapper green"
                style={{ marginBottom: "1.25rem" }}
              >
                <Truck size={28} />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--navy)",
                  marginBottom: "0.5rem",
                }}
              >
                Ambulance Drivers
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  marginBottom: "1.25rem",
                }}
              >
                Receive immediate dispatch orders, broadcast live coordinates,
                and update mission stages.
              </p>
              <Link
                to="/driver-dashboard"
                className="btn-secondary"
                style={{
                  textDecoration: "none",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <span>Driver Portal</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Admin Card */}
          <div
            className="card"
            style={{ transition: "transform 0.2s", margin: 0 }}
          >
            <div className="card-body" style={{ padding: "1.75rem" }}>
              <div
                className="stat-icon-wrapper purple"
                style={{ marginBottom: "1.25rem" }}
              >
                <Activity size={28} />
              </div>
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--navy)",
                  marginBottom: "0.5rem",
                }}
              >
                Administrators
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  marginBottom: "1.25rem",
                }}
              >
                Monitor network dispatch health, view registered facilities, and
                oversee emergency feeds.
              </p>
              <Link
                to="/admin-dashboard"
                className="btn-secondary"
                style={{
                  textDecoration: "none",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <span>Admin Portal</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto 5rem",
          padding: "0 1.5rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              color: "var(--navy)",
              marginBottom: "0.5rem",
            }}
          >
            How LifeLine Connect Responds In Seconds
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
            Automated synchronization between patient, medical center, and
            ambulance units.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "2rem",
          }}
        >
          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                fontWeight: 800,
                fontSize: "1.25rem",
              }}
            >
              1
            </div>
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              1-Click SOS Trigger
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Patient presses SOS. Browser GPS instantly captures exact
              coordinates and severity.
            </p>
          </div>

          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#e0f2fe",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                fontWeight: 800,
                fontSize: "1.25rem",
              }}
            >
              2
            </div>
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Hospital Alert
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Target hospital emergency room receives audio-visual alarm with
              patient medical notes.
            </p>
          </div>

          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                fontWeight: 800,
                fontSize: "1.25rem",
              }}
            >
              3
            </div>
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Ambulance Dispatched
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Nearest available ambulance is allocated. Driver accepts mission
              and initiates siren route.
            </p>
          </div>

          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                fontWeight: 800,
                fontSize: "1.25rem",
              }}
            >
              4
            </div>
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              Live GPS Tracking
            </h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Patient sees live ambulance location, ETA countdown, and vehicle
              contact details on radar.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: "#0f172a",
          color: "#94a3b8",
          padding: "3rem 2rem",
          borderTop: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div className="brand-icon-box">
              <Ambulance size={20} />
            </div>
            <span
              style={{ color: "white", fontWeight: 800, fontSize: "1.1rem" }}
            >
              LifeLine Connect
            </span>
          </div>

          <div style={{ fontSize: "0.9rem" }}>
            Emergency Response Portal • Connected to National Health Services
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link
              to="/login"
              style={{ color: "#cbd5e1", textDecoration: "none" }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              style={{ color: "#cbd5e1", textDecoration: "none" }}
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
