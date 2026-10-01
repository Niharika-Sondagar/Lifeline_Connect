import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAllEmergencies,
  updateEmergencyStatus,
} from "../services/emergencyService";
import {
  getAllAmbulances,
  updateAmbulanceStatus,
  updateAmbulanceLocation,
} from "../services/ambulanceService";
import LiveMapSimulation from "../components/LiveMapSimulation";
import EmergencyStatusTracker from "../components/EmergencyStatusTracker";
import {
  Truck,
  Navigation,
  Radio,
  Phone,
  CheckCircle2,
  MapPin,
  AlertTriangle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Activity,
  Building2,
} from "lucide-react";
export default function DriverDashboard() {
  const { user } = useAuth();
  const [assignedAmbulance, setAssignedAmbulance] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [broadcastingGps, setBroadcastingGps] = useState(true);
  const [driverCoords, setDriverCoords] = useState([72.5714, 23.0225]);

  const loadDriverData = async () => {
    try {
      // 1. Find the ambulance associated with this driver
      const ambRes = await getAllAmbulances();
      const myAmb =
        ambRes.ambulances?.find(
          (a) => a.driver?._id === user?.id || a.driver === user?.id,
        ) || ambRes.ambulances?.[0]; // Fallback to first if demo/unlinked

      setAssignedAmbulance(myAmb || null);
      if (myAmb?.currentLocation?.coordinates) {
        setDriverCoords(myAmb.currentLocation.coordinates);
      }

      // 2. Find emergency assigned to this driver or ambulance
      const emRes = await getAllEmergencies();
      const allEm = emRes.emergencies || [];

      const myActive = allEm.find((e) => {
        const isMyAmb =
          e.ambulance?._id === myAmb?._id || e.ambulance === myAmb?._id;
        const isMyDriver = e.driver?._id === user?.id || e.driver === user?.id;
        const isActive = [
          "ambulance_assigned",
          "on_the_way",
          "reached_patient",
        ].includes(e.status);
        return (isMyAmb || isMyDriver) && isActive;
      });

      setActiveEmergency(myActive || null);

      // Past missions
      const past = allEm.filter((e) => {
        const isMyAmb =
          e.ambulance?._id === myAmb?._id || e.ambulance === myAmb?._id;
        const isMyDriver = e.driver?._id === user?.id || e.driver === user?.id;
        return (
          (isMyAmb || isMyDriver) &&
          ["completed", "cancelled"].includes(e.status)
        );
      });
      setMissions(past);
    } catch (err) {
      console.error("Failed to load driver dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
    const interval = setInterval(loadDriverData, 6000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Simulated GPS Beacon update every 12 seconds when active mission exists
  useEffect(() => {
    if (!broadcastingGps || !assignedAmbulance?._id || !activeEmergency) return;

    const beaconTimer = setInterval(async () => {
      try {
        // Move coordinates slightly toward patient location
        const targetLng =
          activeEmergency.patientLocation?.coordinates?.[0] || 72.5714;
        const targetLat =
          activeEmergency.patientLocation?.coordinates?.[1] || 23.0225;

        setDriverCoords((prev) => {
          const nextLng = prev[0] + (targetLng - prev[0]) * 0.15;
          const nextLat = prev[1] + (targetLat - prev[1]) * 0.15;
          // Send to server
          updateAmbulanceLocation(
            assignedAmbulance._id,
            nextLat,
            nextLng,
          ).catch(() => {});
          return [nextLng, nextLat];
        });
      } catch (err) {
        console.warn("Beacon update error:", err);
      }
    }, 10000);

    return () => clearInterval(beaconTimer);
  }, [broadcastingGps, assignedAmbulance?._id, activeEmergency]);

  // Transition Emergency Status
  const handleTransitionStatus = async (newStatus) => {
    if (!activeEmergency) return;
    setUpdatingStatus(true);
    try {
      await updateEmergencyStatus(activeEmergency._id, newStatus);

      // Also update ambulance status
      if (assignedAmbulance?._id) {
        const ambStatus =
          newStatus === "completed" ? "available" : "on_the_way";
        await updateAmbulanceStatus(assignedAmbulance._id, ambStatus);
      }

      await loadDriverData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Toggle Driver Availability
  const handleToggleDutyStatus = async (status) => {
    if (!assignedAmbulance?._id) return;
    try {
      await updateAmbulanceStatus(assignedAmbulance._id, status);
      await loadDriverData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Paramedic & Driver Command</h1>
          <p>
            Driver: <strong>{user?.name}</strong> • Vehicle:{" "}
            <strong style={{ color: "#0284c7" }}>
              {assignedAmbulance?.vehicleNumber || "Assigned Ambulance Unit"}
            </strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* Duty status toggle */}
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <button
              onClick={() => handleToggleDutyStatus("available")}
              className={`btn-secondary ${assignedAmbulance?.status === "available" ? "btn-success" : ""}`}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
            >
              Available
            </button>
            <button
              onClick={() => handleToggleDutyStatus("busy")}
              className={`btn-secondary ${assignedAmbulance?.status === "busy" ? "btn-primary" : ""}`}
              style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
            >
              Busy
            </button>
          </div>

          <button
            onClick={loadDriverData}
            className="btn-secondary"
            title="Refresh"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ACTIVE EMERGENCY MISSION */}
      {activeEmergency ? (
        <div
          className="card"
          style={{
            border: "2px solid #0284c7",
            boxShadow: "0 10px 30px rgba(2, 132, 199, 0.15)",
          }}
        >
          <div className="card-header" style={{ background: "#e0f2fe" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <Radio size={22} color="#0284c7" className="animate-pulse-red" />
              <h2 style={{ color: "#0369a1" }}>
                Active Emergency Mission: {activeEmergency.emergencyType}
              </h2>
            </div>
            <span className={`status-pill ${activeEmergency.status}`}>
              {activeEmergency.status.replace("_", " ")}
            </span>
          </div>

          <div className="card-body">
            {/* Status Stepper */}
            <EmergencyStatusTracker status={activeEmergency.status} />

            {/* Radar Simulation */}
            <LiveMapSimulation
              patientLocation={activeEmergency.patientLocation}
              hospital={activeEmergency.hospital}
              ambulance={assignedAmbulance}
              status={activeEmergency.status}
            />

            {/* Patient & Dispatch Details */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.25rem",
                margin: "1.5rem 0",
              }}
            >
              <div
                style={{
                  background: "var(--bg-muted)",
                  padding: "1.25rem",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                >
                  Patient Name
                </span>
                <strong
                  style={{
                    display: "block",
                    fontSize: "1.1rem",
                    color: "var(--navy)",
                    marginTop: "0.25rem",
                  }}
                >
                  {activeEmergency.patient?.name || "Emergency Patient"}
                </strong>
                {activeEmergency.patient?.phone && (
                  <a
                    href={`tel:${activeEmergency.patient.phone}`}
                    className="btn-primary"
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                    }}
                  >
                    <Phone size={14} />
                    <span>Call Patient: {activeEmergency.patient.phone}</span>
                  </a>
                )}
              </div>

              <div
                style={{
                  background: "var(--bg-muted)",
                  padding: "1.25rem",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                >
                  Pickup Coordinates
                </span>
                <strong
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    color: "#dc2626",
                    marginTop: "0.25rem",
                  }}
                >
                  [
                  {activeEmergency.patientLocation?.coordinates?.[0]?.toFixed(
                    4,
                  )}
                  ,{" "}
                  {activeEmergency.patientLocation?.coordinates?.[1]?.toFixed(
                    4,
                  )}
                  ]
                </strong>
                <p
                  style={{
                    margin: "0.5rem 0 0",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {activeEmergency.description ||
                    "Urgent emergency pickup requested."}
                </p>
              </div>

              <div
                style={{
                  background: "var(--bg-muted)",
                  padding: "1.25rem",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                >
                  Destination Base
                </span>
                <strong
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    color: "#16a34a",
                    marginTop: "0.25rem",
                  }}
                >
                  {activeEmergency.hospital?.name ||
                    "Trauma Emergency Hospital"}
                </strong>
                <span
                  style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}
                >
                  {activeEmergency.hospital?.phone || ""}
                </span>
              </div>
            </div>

            {/* Quick Action Progression Buttons */}
            <div
              style={{
                background: "#f8fafc",
                padding: "1.25rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
              >
                <Navigation size={18} color="#0284c7" />
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                  Mission Actions:
                </span>
              </div>

              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                {activeEmergency.status === "ambulance_assigned" && (
                  <button
                    onClick={() => handleTransitionStatus("on_the_way")}
                    disabled={updatingStatus}
                    className="btn-primary"
                    style={{ background: "#d97706" }}
                  >
                    <Truck size={16} />
                    <span>Confirm Start / En Route</span>
                  </button>
                )}

                {activeEmergency.status === "on_the_way" && (
                  <button
                    onClick={() => handleTransitionStatus("reached_patient")}
                    disabled={updatingStatus}
                    className="btn-primary"
                    style={{ background: "#0284c7" }}
                  >
                    <MapPin size={16} />
                    <span>Mark Reached Patient</span>
                  </button>
                )}

                {activeEmergency.status === "reached_patient" && (
                  <button
                    onClick={() => handleTransitionStatus("completed")}
                    disabled={updatingStatus}
                    className="btn-success"
                  >
                    <CheckCircle2 size={16} />
                    <span>Complete Mission & Patient Handover</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STANDBY CARD */
        <div
          className="card"
          style={{ textAlign: "center", padding: "3rem 1.5rem" }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "#dcfce7",
              borderRadius: "50%",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <ShieldCheck size={36} />
          </div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--navy)",
              marginBottom: "0.5rem",
            }}
          >
            On Standby • Ready for Emergency Dispatch
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              maxWidth: "550px",
              margin: "0 auto 1.5rem",
              fontSize: "0.95rem",
            }}
          >
            Your ambulance vehicle is currently operational. As soon as a
            hospital emergency room dispatches a call to your unit, your siren
            route and patient details will appear here.
          </p>

          <div
            style={{
              display: "inline-flex",
              gap: "1.5rem",
              background: "var(--bg-muted)",
              padding: "1rem 2rem",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Unit Status
              </span>
              <strong
                style={{
                  display: "block",
                  color: "#16a34a",
                  textTransform: "capitalize",
                }}
              >
                {assignedAmbulance?.status || "Ready"}
              </strong>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                GPS Telemetry
              </span>
              <strong style={{ display: "block", color: "#0284c7" }}>
                Active Beacon
              </strong>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Oxygen & Trauma Kit
              </span>
              <strong style={{ display: "block", color: "var(--navy)" }}>
                Inspected
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* PAST MISSIONS TABLE */}
      <div className="card">
        <div className="card-header">
          <h2>
            <Clock size={20} color="var(--navy)" />
            Completed Emergency Missions
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Total Completed: {missions.length}
          </span>
        </div>

        <div className="table-responsive">
          {missions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Truck size={28} />
              </div>
              <h4>No Completed Missions Yet</h4>
              <p>
                Missions completed by your vehicle will appear in this history
                log.
              </p>
            </div>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Mission Date</th>
                  <th>Patient</th>
                  <th>Emergency Type</th>
                  <th>Hospital Destination</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {missions.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <strong>
                        {new Date(
                          m.requestedAt || m.createdAt,
                        ).toLocaleDateString()}
                      </strong>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {new Date(
                          m.requestedAt || m.createdAt,
                        ).toLocaleTimeString()}
                      </span>
                    </td>
                    <td>{m.patient?.name || "Patient"}</td>
                    <td>{m.emergencyType}</td>
                    <td>{m.hospital?.name || "Hospital Base"}</td>
                    <td>
                      <span className={`status-pill ${m.status}`}>
                        {m.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
