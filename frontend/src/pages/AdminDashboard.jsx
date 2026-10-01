import { useState, useEffect } from "react";
import { getAllEmergencies } from "../services/emergencyService";
import { getAllHospitals } from "../services/hospitalService";
import { getAllAmbulances } from "../services/ambulanceService";
import {
  Activity,
  Building2,
  Truck,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MapPin,
  ShieldCheck,
  Clock,
} from "lucide-react";

export default function AdminDashboard() {
  const [emergencies, setEmergencies] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("emergencies");
  const [searchFilter, setSearchFilter] = useState("");

  const loadAllNetworkData = async () => {
    try {
      const [emRes, hospRes, ambRes] = await Promise.all([
        getAllEmergencies(),
        getAllHospitals().catch(() => ({ hospitals: [] })),
        getAllAmbulances().catch(() => ({ ambulances: [] })),
      ]);

      setEmergencies(emRes.emergencies || []);
      setHospitals(hospRes.hospitals || []);
      setAmbulances(ambRes.ambulances || []);
    } catch (err) {
      console.error("Failed to load admin network data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllNetworkData();
    const interval = setInterval(loadAllNetworkData, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalEmergencies = emergencies.length;
  const activeEmergencies = emergencies.filter((e) =>
    [
      "pending",
      "accepted",
      "ambulance_assigned",
      "on_the_way",
      "reached_patient",
    ].includes(e.status),
  ).length;
  const totalHospitals = hospitals.length;
  const totalAmbulances = ambulances.length;

  const filteredEmergencies = emergencies.filter((e) => {
    if (!searchFilter) return true;
    const term = searchFilter.toLowerCase();
    return (
      e.patient?.name?.toLowerCase().includes(term) ||
      e.hospital?.name?.toLowerCase().includes(term) ||
      e.emergencyType?.toLowerCase().includes(term) ||
      e.status?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>System Administration & Health Monitor</h1>
          <p>
            Global oversight of emergency response pipelines, fleet telemetry,
            and hospital partners.
          </p>
        </div>

        <button onClick={loadAllNetworkData} className="btn-secondary">
          <RefreshCw size={16} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Network Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <AlertCircle size={26} />
          </div>
          <div className="stat-details">
            <h3>{totalEmergencies}</h3>
            <p>Total Emergency Requests</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper amber">
            <Activity size={26} />
          </div>
          <div className="stat-details">
            <h3>{activeEmergencies}</h3>
            <p>Active Live Incidents</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Building2 size={26} />
          </div>
          <div className="stat-details">
            <h3>{totalHospitals}</h3>
            <p>Registered Hospitals</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <Truck size={26} />
          </div>
          <div className="stat-details">
            <h3>{totalAmbulances}</h3>
            <p>Connected Ambulances</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("emergencies")}
          className={`btn-secondary ${activeTab === "emergencies" ? "btn-primary" : ""}`}
        >
          <Activity size={16} />
          <span>Master Emergency Logs ({emergencies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("hospitals")}
          className={`btn-secondary ${activeTab === "hospitals" ? "btn-primary" : ""}`}
        >
          <Building2 size={16} />
          <span>Hospitals Directory ({hospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ambulances")}
          className={`btn-secondary ${activeTab === "ambulances" ? "btn-primary" : ""}`}
        >
          <Truck size={16} />
          <span>Ambulances Fleet ({ambulances.length})</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCIES */}
      {activeTab === "emergencies" && (
        <div className="card">
          <div
            className="card-header"
            style={{ flexWrap: "wrap", gap: "1rem" }}
          >
            <h2>
              <Activity size={20} color="var(--primary)" />
              All Network Emergency Records
            </h2>
            <input
              type="text"
              className="form-control-modern"
              placeholder="Filter by patient, hospital, category, status..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ maxWidth: "320px" }}
            />
          </div>

          <div className="table-responsive">
            {filteredEmergencies.length === 0 ? (
              <div className="empty-state">
                <h4>No Matching Emergencies</h4>
              </div>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Patient</th>
                    <th>Emergency Type</th>
                    <th>Hospital Base</th>
                    <th>Ambulance Unit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmergencies.map((em) => (
                    <tr key={em._id}>
                      <td>
                        <strong>
                          {new Date(
                            em.requestedAt || em.createdAt,
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
                            em.requestedAt || em.createdAt,
                          ).toLocaleTimeString()}
                        </span>
                      </td>
                      <td>
                        <strong>{em.patient?.name || "Patient"}</strong>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.8rem",
                            color: "#0284c7",
                          }}
                        >
                          {em.patient?.phone}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {em.emergencyType}
                        </span>
                        {em.description && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {em.description.substring(0, 35)}...
                          </span>
                        )}
                      </td>
                      <td>{em.hospital?.name || "Unassigned ER"}</td>
                      <td>
                        {em.ambulance ? (
                          <div>
                            <strong>{em.ambulance.vehicleNumber}</strong>
                            <span
                              style={{
                                display: "block",
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {em.driver?.name}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>
                            None
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${em.status}`}>
                          {em.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: HOSPITALS */}
      {activeTab === "hospitals" && (
        <div className="card">
          <div className="card-header">
            <h2>
              <Building2 size={20} color="#0284c7" />
              Connected Hospitals Directory
            </h2>
          </div>

          <div className="table-responsive">
            {hospitals.length === 0 ? (
              <div className="empty-state">
                <h4>No Hospitals Registered</h4>
              </div>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Hospital Name</th>
                    <th>Address</th>
                    <th>Contact Phone</th>
                    <th>Coordinates</th>
                    <th>User Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {hospitals.map((h) => (
                    <tr key={h._id}>
                      <td>
                        <strong style={{ fontSize: "1rem" }}>{h.name}</strong>
                      </td>
                      <td>{h.address}</td>
                      <td>
                        <strong style={{ color: "#0284c7" }}>{h.phone}</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          [{h.location?.coordinates?.[0]?.toFixed(4)},{" "}
                          {h.location?.coordinates?.[1]?.toFixed(4)}]
                        </span>
                      </td>
                      <td>
                        {h.user?.name || "Admin"} ({h.user?.email || ""})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AMBULANCES */}
      {activeTab === "ambulances" && (
        <div className="card">
          <div className="card-header">
            <h2>
              <Truck size={20} color="#16a34a" />
              Emergency Ambulance Fleets
            </h2>
          </div>

          <div className="table-responsive">
            {ambulances.length === 0 ? (
              <div className="empty-state">
                <h4>No Ambulances Found In Network</h4>
              </div>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Vehicle Plate</th>
                    <th>Operating Hospital</th>
                    <th>Driver Assigned</th>
                    <th>Operational Status</th>
                    <th>Last Known GPS</th>
                  </tr>
                </thead>
                <tbody>
                  {ambulances.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <strong
                          style={{ fontSize: "1.05rem", color: "var(--navy)" }}
                        >
                          {a.vehicleNumber}
                        </strong>
                      </td>
                      <td>{a.hospital?.name || "General Fleet"}</td>
                      <td>{a.driver?.name || "Standby Driver"}</td>
                      <td>
                        <span className={`status-pill ${a.status}`}>
                          {a.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          [{a.currentLocation?.coordinates?.[0]?.toFixed(4)},{" "}
                          {a.currentLocation?.coordinates?.[1]?.toFixed(4)}]
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
