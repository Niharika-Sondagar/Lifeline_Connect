import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAllEmergencies,
  updateEmergencyStatus,
  assignAmbulance,
} from "../services/emergencyService";
import {
  getAllAmbulances,
  createAmbulance,
} from "../services/ambulanceService";
import {
  getHospitalProfile,
  updateHospitalProfile,
} from "../services/hospitalService";
import {
  Building2,
  Truck,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCheck,
  Clock,
  Plus,
  RefreshCw,
  Activity,
  Phone,
  MapPin,
  Send,
} from "lucide-react";

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [hospitalData, setHospitalData] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all");

  // Assignment Modal
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // New Ambulance Form Modal
  const [showAddAmbulance, setShowAddAmbulance] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState("");
  const [addingAmbulance, setAddingAmbulance] = useState(false);

  const hospitalId = user?.hospitalId;

  const loadData = async () => {
    try {
      // 1. Fetch emergencies (hospital specific or unassigned open pool)
      const emRes = await getAllEmergencies();
      const allEm = emRes.emergencies || [];

      // Filter emergencies that either belong to this hospital or are unassigned
      const filteredEm = allEm.filter((em) => {
        if (!hospitalId) return true;
        return (
          em.hospital?._id === hospitalId ||
          em.hospital === hospitalId ||
          !em.hospital
        );
      });
      setEmergencies(filteredEm);

      // 2. Fetch fleet ambulances
      const ambRes = await getAllAmbulances();
      const allAmb = ambRes.ambulances || [];
      const hospAmb = hospitalId
        ? allAmb.filter(
            (a) => a.hospital?._id === hospitalId || a.hospital === hospitalId,
          )
        : allAmb;
      setAmbulances(hospAmb);

      // 3. Hospital profile
      if (hospitalId) {
        const profRes = await getHospitalProfile(hospitalId).catch(() => null);
        if (profRes) setHospitalData(profRes);
      }
    } catch (err) {
      console.error("Failed to load hospital dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 7000);
    return () => clearInterval(interval);
  }, [hospitalId]);

  // Accept emergency
  const handleAccept = async (emergencyId) => {
    try {
      await updateEmergencyStatus(emergencyId, "accepted", { hospitalId });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept emergency.");
    }
  };

  // Reject emergency
  const handleReject = async (emergencyId) => {
    if (
      !window.confirm(
        "Are you sure you want to decline this emergency request?",
      )
    )
      return;
    try {
      await updateEmergencyStatus(emergencyId, "rejected");
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject emergency.");
    }
  };

  // Assign Ambulance
  const handleAssignAmbulance = async (e) => {
    e.preventDefault();
    if (!selectedAmbulanceId || !selectedEmergency) return;

    setAssigning(true);
    try {
      await assignAmbulance(selectedEmergency._id, selectedAmbulanceId);
      setSelectedEmergency(null);
      setSelectedAmbulanceId("");
      await loadData();
      alert("Ambulance dispatched successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to dispatch ambulance.");
    } finally {
      setAssigning(false);
    }
  };

  // Add Ambulance
  const handleCreateAmbulance = async (e) => {
    e.preventDefault();
    if (!newVehicleNumber) return;

    setAddingAmbulance(true);
    try {
      await createAmbulance({
        vehicleNumber: newVehicleNumber.toUpperCase().trim(),
        hospital: hospitalId || ambulances[0]?.hospital?._id || user?.id,
        status: "available",
      });
      setNewVehicleNumber("");
      setShowAddAmbulance(false);
      await loadData();
      alert("New ambulance vehicle added to fleet!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add ambulance vehicle.");
    } finally {
      setAddingAmbulance(false);
    }
  };

  // Metrics
  const pendingCount = emergencies.filter((e) => e.status === "pending").length;
  const activeMissionsCount = emergencies.filter((e) =>
    [
      "accepted",
      "ambulance_assigned",
      "on_the_way",
      "reached_patient",
    ].includes(e.status),
  ).length;
  const availableFleetCount = ambulances.filter(
    (a) => a.status === "available",
  ).length;
  const completedCount = emergencies.filter(
    (e) => e.status === "completed",
  ).length;

  const displayedEmergencies = emergencies.filter((e) => {
    if (filterTab === "all") return true;
    if (filterTab === "pending") return e.status === "pending";
    if (filterTab === "active")
      return [
        "accepted",
        "ambulance_assigned",
        "on_the_way",
        "reached_patient",
      ].includes(e.status);
    if (filterTab === "completed") return e.status === "completed";
    return true;
  });

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Hospital ER Dispatch Control</h1>
          <p>
            Facility: <strong>{hospitalData?.name || user?.name}</strong> •
            Base: {hospitalData?.address || "Emergency Medical Command"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => setShowAddAmbulance(true)}
            className="btn-primary"
          >
            <Plus size={16} />
            <span>Add Ambulance</span>
          </button>
          <button
            onClick={loadData}
            className="btn-secondary"
            title="Refresh Feed"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <AlertCircle size={26} />
          </div>
          <div className="stat-details">
            <h3>{pendingCount}</h3>
            <p>Pending SOS Alerts</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper amber">
            <Truck size={26} />
          </div>
          <div className="stat-details">
            <h3>{activeMissionsCount}</h3>
            <p>Active En Route Missions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle size={26} />
          </div>
          <div className="stat-details">
            <h3>{availableFleetCount}</h3>
            <p>Available Ambulances</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Activity size={26} />
          </div>
          <div className="stat-details">
            <h3>{completedCount}</h3>
            <p>Total Triage Completed</p>
          </div>
        </div>
      </div>

      {/* Emergency Dispatch Feed Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <h2>
            <AlertCircle size={20} color="var(--primary)" />
            Emergency Dispatch Queue
          </h2>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setFilterTab("pending")}
              className={`btn-secondary ${filterTab === "pending" ? "btn-primary" : ""}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}
            >
              Pending Alerts ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab("active")}
              className={`btn-secondary ${filterTab === "active" ? "btn-primary" : ""}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}
            >
              Active Missions ({activeMissionsCount})
            </button>
            <button
              onClick={() => setFilterTab("completed")}
              className={`btn-secondary ${filterTab === "completed" ? "btn-primary" : ""}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setFilterTab("all")}
              className={`btn-secondary ${filterTab === "all" ? "btn-primary" : ""}`}
              style={{ padding: "0.35rem 0.8rem", fontSize: "0.85rem" }}
            >
              All
            </button>
          </div>
        </div>

        <div className="table-responsive">
          {displayedEmergencies.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <CheckCircle size={28} />
              </div>
              <h4>No Emergencies In This Queue</h4>
              <p>
                Everything is currently clear in the selected emergency status.
              </p>
            </div>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Patient & Phone</th>
                  <th>Emergency Category</th>
                  <th>Pickup Location</th>
                  <th>Assigned Ambulance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedEmergencies.map((em) => (
                  <tr key={em._id}>
                    <td>
                      <strong>{em.patient?.name || "Anonymous Patient"}</strong>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.8rem",
                          color: "#0284c7",
                        }}
                      >
                        📞 {em.patient?.phone || "No phone"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "#b91c1c" }}>
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
                          {em.description}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        <MapPin size={14} color="#dc2626" />[
                        {em.patientLocation?.coordinates?.[0]?.toFixed(4)},{" "}
                        {em.patientLocation?.coordinates?.[1]?.toFixed(4)}]
                      </span>
                    </td>
                    <td>
                      {em.ambulance ? (
                        <div>
                          <strong style={{ color: "#0284c7" }}>
                            {em.ambulance.vehicleNumber}
                          </strong>
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            Driver: {em.driver?.name || "Assigned"}
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.85rem",
                          }}
                        >
                          None
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${em.status}`}>
                        {em.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {em.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                handleAccept(em._id);
                                setSelectedEmergency(em);
                                const avail = ambulances.find(
                                  (a) => a.status === "available",
                                );
                                if (avail) setSelectedAmbulanceId(avail._id);
                              }}
                              className="btn-primary"
                              style={{
                                padding: "0.4rem 0.75rem",
                                fontSize: "0.8rem",
                                background: "#0284c7",
                              }}
                              title="Accept and dispatch ambulance immediately"
                            >
                              <Send size={14} />
                              <span>Dispatch Ambulance</span>
                            </button>
                            <button
                              onClick={() => handleAccept(em._id)}
                              className="btn-success"
                              style={{
                                padding: "0.4rem 0.75rem",
                                fontSize: "0.8rem",
                              }}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(em._id)}
                              className="btn-secondary"
                              style={{
                                padding: "0.4rem 0.75rem",
                                fontSize: "0.8rem",
                                color: "#dc2626",
                              }}
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {em.status === "accepted" && (
                          <button
                            onClick={() => {
                              setSelectedEmergency(em);
                              const avail = ambulances.find(
                                (a) => a.status === "available",
                              );
                              if (avail) setSelectedAmbulanceId(avail._id);
                            }}
                            className="btn-primary"
                            style={{
                              padding: "0.45rem 0.85rem",
                              fontSize: "0.85rem",
                              background: "#0284c7",
                              fontWeight: 700,
                            }}
                          >
                            <Send size={15} />
                            <span>Dispatch Ambulance</span>
                          </button>
                        )}

                        {["ambulance_assigned", "on_the_way"].includes(
                          em.status,
                        ) && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "#0284c7",
                              fontWeight: 600,
                            }}
                          >
                            En Route
                          </span>
                        )}

                        {em.status === "reached_patient" && (
                          <button
                            onClick={async () => {
                              await updateEmergencyStatus(em._id, "completed");
                              await loadData();
                            }}
                            className="btn-success"
                            style={{
                              padding: "0.4rem 0.75rem",
                              fontSize: "0.8rem",
                            }}
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ambulance Fleet Management Section */}
      <div className="card">
        <div className="card-header">
          <h2>
            <Truck size={20} color="#0284c7" />
            Ambulance Fleet Status ({ambulances.length} Units)
          </h2>
          <button
            onClick={() => setShowAddAmbulance(true)}
            className="btn-secondary"
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
          >
            <Plus size={14} /> Add Vehicle
          </button>
        </div>

        <div className="table-responsive">
          {ambulances.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Truck size={28} />
              </div>
              <h4>No Ambulances Registered</h4>
              <p>
                Click "Add Ambulance" to register your facility's first vehicle.
              </p>
            </div>
          ) : (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>GPS Coordinates</th>
                  <th>Registered Facility</th>
                </tr>
              </thead>
              <tbody>
                {ambulances.map((amb) => (
                  <tr key={amb._id}>
                    <td>
                      <strong style={{ fontSize: "1rem" }}>
                        {amb.vehicleNumber}
                      </strong>
                    </td>
                    <td>{amb.driver?.name || "Unassigned"}</td>
                    <td>
                      <span className={`status-pill ${amb.status}`}>
                        {amb.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        [
                        {amb.currentLocation?.coordinates?.[0]?.toFixed(4) ||
                          "0"}
                        ,{" "}
                        {amb.currentLocation?.coordinates?.[1]?.toFixed(4) ||
                          "0"}
                        ]
                      </span>
                    </td>
                    <td>{amb.hospital?.name || "General Fleet"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL: ASSIGN AMBULANCE */}
      {selectedEmergency && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Dispatch Ambulance Unit</h3>
              <button
                onClick={() => setSelectedEmergency(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAssignAmbulance}>
              <div className="modal-body">
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "var(--text-muted)",
                    marginBottom: "1rem",
                  }}
                >
                  Dispatching for:{" "}
                  <strong>{selectedEmergency.emergencyType}</strong>
                  <br />
                  Patient: {selectedEmergency.patient?.name} (Phone:{" "}
                  {selectedEmergency.patient?.phone})
                </p>

                <div className="form-group-modern">
                  <label>Select Available Ambulance & Driver</label>
                  <select
                    className="form-control-modern"
                    value={selectedAmbulanceId}
                    onChange={(e) => setSelectedAmbulanceId(e.target.value)}
                    required
                  >
                    <option value="">
                      -- Choose an Available Ambulance --
                    </option>
                    {ambulances.map((a) => (
                      <option
                        key={a._id}
                        value={a._id}
                        disabled={a.status !== "available"}
                      >
                        {a.vehicleNumber} -{" "}
                        {a.driver?.name
                          ? `Driver: ${a.driver.name}`
                          : "Driver: Standby"}{" "}
                        ({a.status})
                      </option>
                    ))}
                  </select>
                </div>

                {ambulances.filter((a) => a.status === "available").length ===
                  0 && (
                  <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>
                    ⚠️ No ambulances are currently marked as "available". Please
                    register an ambulance or wait for active trips to complete.
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setSelectedEmergency(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedAmbulanceId}
                  className="btn-primary"
                >
                  <Send size={16} />
                  <span>
                    {assigning ? "Dispatching..." : "Confirm & Dispatch Now"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD AMBULANCE */}
      {showAddAmbulance && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register New Ambulance Vehicle</h3>
              <button
                onClick={() => setShowAddAmbulance(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAmbulance}>
              <div className="modal-body">
                <div className="form-group-modern">
                  <label>Ambulance Plate / Vehicle Number</label>
                  <input
                    type="text"
                    className="form-control-modern"
                    placeholder="e.g. GJ-01-AM-5501"
                    value={newVehicleNumber}
                    onChange={(e) => setNewVehicleNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddAmbulance(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingAmbulance || !newVehicleNumber}
                  className="btn-primary"
                >
                  <span>
                    {addingAmbulance
                      ? "Registering..."
                      : "Add Vehicle to Fleet"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
