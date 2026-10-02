import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

import {
  getAllEmergencies,
  updateEmergencyStatus,
  assignAmbulance,
  acceptAndAssignAmbulance,
} from "../services/emergencyService";
import {
  getAllAmbulances,
  createAmbulance,
} from "../services/ambulanceService";

import {
  getHospitalProfile,
} from "../services/hospitalService";

import {
  Truck,
  AlertCircle,
  CheckCircle,
  Plus,
  RefreshCw,
  Activity,
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
  const [processingId, setProcessingId] = useState(null);

  // Add Ambulance Modal
  const [showAddAmbulance, setShowAddAmbulance] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState("");
  const [addingAmbulance, setAddingAmbulance] = useState(false);

  const hospitalId = user?.hospitalId;

  // ============================================================
  // LOAD HOSPITAL DATA
  // ============================================================

  const loadData = async () => {
    try {
      console.log("🏥 Loading hospital dashboard...");

      // ----------------------------------------------------------
      // 1. GET EMERGENCIES
      // ----------------------------------------------------------

      const emRes = await getAllEmergencies();
      const allEm = emRes.emergencies || [];

      console.log("🚨 All emergencies:", allEm);

      const filteredEm = allEm.filter((em) => {
        if (!hospitalId) return true;

        return (
          em.hospital?._id === hospitalId ||
          em.hospital === hospitalId ||
          !em.hospital
        );
      });

      setEmergencies(filteredEm);

      // ----------------------------------------------------------
      // 2. GET AMBULANCES
      // ----------------------------------------------------------

      const ambRes = await getAllAmbulances();
      const allAmb = ambRes.ambulances || [];

      console.log("🚑 All ambulances:", allAmb);

      const hospAmb = hospitalId
        ? allAmb.filter(
            (ambulance) =>
              ambulance.hospital?._id === hospitalId ||
              ambulance.hospital === hospitalId
          )
        : allAmb;

      console.log("🚑 Hospital ambulances:", hospAmb);

      setAmbulances(hospAmb);

      // ----------------------------------------------------------
      // 3. GET HOSPITAL PROFILE
      // ----------------------------------------------------------

      if (hospitalId) {
        const profRes = await getHospitalProfile(hospitalId).catch(
          () => null
        );

        if (profRes) {
          setHospitalData(profRes);
        }
      }
    } catch (err) {
      console.error(
        "❌ Failed to load hospital dashboard data:",
        err
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load + automatic refresh
  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 7000);

    return () => clearInterval(interval);
  }, [hospitalId]);

  // ============================================================
  // ACCEPT / AUTOMATICALLY ASSIGN & DISPATCH AMBULANCE
  // ============================================================

  const handleAccept = async (emergencyId) => {
    try {
      setProcessingId(emergencyId);

      const result = await acceptAndAssignAmbulance(emergencyId, hospitalId);

      console.log("🚑 ACCEPT + ASSIGN RESULT:", result);

      const vehicleNum =
        result.emergency?.ambulance?.vehicleNumber || "Assigned Ambulance";
      const driverName =
        result.emergency?.driver?.name ||
        result.emergency?.ambulance?.driver?.name ||
        "Paramedic Driver";

      alert(
        `✅ Emergency Accepted & Dispatched!\n` +
        `• Ambulance Unit: ${vehicleNum}\n` +
        `• Driver: ${driverName}\n` +
        `• Status: Ambulance Assigned & En Route`
      );

      await loadData();
    } catch (error) {
      console.error("❌ Accept + Assign failed:", error);

      alert(
        error.response?.data?.message ||
          "Failed to accept emergency and assign ambulance."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // COMPLETE EMERGENCY MANUALLY
  // ============================================================

  const handleCompleteEmergency = async (emergencyId) => {
    if (
      !window.confirm(
        "Are you sure you want to mark this emergency as completed? The assigned ambulance will be released back to the available fleet."
      )
    ) {
      return;
    }

    try {
      setProcessingId(emergencyId);

      await updateEmergencyStatus(emergencyId, "completed");

      await loadData();

      alert(
        "✅ Emergency mission marked as completed!\nThe assigned ambulance has been returned to available standby."
      );
    } catch (err) {
      console.error("❌ Complete emergency failed:", err);

      alert(
        err.response?.data?.message ||
          "Failed to mark emergency as completed."
      );
    } finally {
      setProcessingId(null);
    }
  };


  // ============================================================
  // REJECT EMERGENCY
  // ============================================================

  const handleReject = async (emergencyId) => {
    if (
      !window.confirm(
        "Are you sure you want to decline this emergency request?"
      )
    ) {
      return;
    }

    try {
      await updateEmergencyStatus(
        emergencyId,
        "rejected"
      );

      await loadData();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to reject emergency."
      );
    }
  };

  // ============================================================
  // MANUAL AMBULANCE ASSIGNMENT
  // ============================================================

  const handleAssignAmbulance = async (e) => {
    e.preventDefault();

    if (
      !selectedAmbulanceId ||
      !selectedEmergency
    ) {
      return;
    }

    setAssigning(true);

    try {
      console.log(
        "🚑 Manually assigning ambulance:",
        selectedAmbulanceId
      );

      await assignAmbulance(
        selectedEmergency._id,
        selectedAmbulanceId
      );

      setSelectedEmergency(null);
      setSelectedAmbulanceId("");

      await loadData();

      alert(
        "Ambulance dispatched successfully!"
      );
    } catch (err) {
      console.error(
        "❌ Manual ambulance assignment failed:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to dispatch ambulance."
      );
    } finally {
      setAssigning(false);
    }
  };

  // ============================================================
  // CREATE NEW AMBULANCE
  // ============================================================

  const handleCreateAmbulance = async (e) => {
    e.preventDefault();

    if (!newVehicleNumber.trim()) {
      return;
    }

    setAddingAmbulance(true);

    try {
      await createAmbulance({
        vehicleNumber:
          newVehicleNumber
            .toUpperCase()
            .trim(),

        hospital:
          hospitalId ||
          ambulances[0]?.hospital?._id ||
          user?.id,

        status: "available",
      });

      setNewVehicleNumber("");
      setShowAddAmbulance(false);

      await loadData();

      alert(
        "New ambulance vehicle added to fleet!"
      );
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Failed to add ambulance vehicle."
      );
    } finally {
      setAddingAmbulance(false);
    }
  };

  // ============================================================
  // METRICS
  // ============================================================

  const pendingCount = emergencies.filter(
    (e) => e.status === "pending"
  ).length;

  const activeMissionsCount = emergencies.filter(
    (e) =>
      [
        "accepted",
        "ambulance_assigned",
        "on_the_way",
        "reached_patient",
      ].includes(e.status)
  ).length;

  const availableFleetCount = ambulances.filter(
    (a) => a.status === "available"
  ).length;

  const completedCount = emergencies.filter(
    (e) => e.status === "completed"
  ).length;

  // ============================================================
  // FILTER EMERGENCIES
  // ============================================================

  const displayedEmergencies =
    emergencies.filter((e) => {
      if (filterTab === "all") {
        return true;
      }

      if (filterTab === "pending") {
        return e.status === "pending";
      }

      if (filterTab === "active") {
        return [
          "accepted",
          "ambulance_assigned",
          "on_the_way",
          "reached_patient",
        ].includes(e.status);
      }

      if (filterTab === "completed") {
        return e.status === "completed";
      }

      return true;
    });

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="dashboard-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="page-header">
        <div>
          <h1>
            Hospital ER Dispatch Control
          </h1>

          <p>
            Facility:{" "}
            <strong>
              {hospitalData?.name ||
                user?.name}
            </strong>{" "}
            • Base:{" "}
            {hospitalData?.address ||
              "Emergency Medical Command"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={() =>
              setShowAddAmbulance(true)
            }
            className="btn-primary"
          >
            <Plus size={16} />
            <span>
              Add Ambulance
            </span>
          </button>

          <button
            onClick={loadData}
            className="btn-secondary"
            title="Refresh Feed"
          >
            <RefreshCw size={16} />
            <span>
              Refresh
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================
          METRICS
      ====================================================== */}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <AlertCircle size={26} />
          </div>

          <div className="stat-details">
            <h3>
              {pendingCount}
            </h3>

            <p>
              Pending SOS Alerts
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper amber">
            <Truck size={26} />
          </div>

          <div className="stat-details">
            <h3>
              {activeMissionsCount}
            </h3>

            <p>
              Active En Route Missions
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle size={26} />
          </div>

          <div className="stat-details">
            <h3>
              {availableFleetCount}
            </h3>

            <p>
              Available Ambulances
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Activity size={26} />
          </div>

          <div className="stat-details">
            <h3>
              {completedCount}
            </h3>

            <p>
              Total Triage Completed
            </p>
          </div>
        </div>

      </div>

      {/* ======================================================
          EMERGENCY DISPATCH QUEUE
      ====================================================== */}

      <div className="card">

        <div
          className="card-header"
          style={{
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h2>
            <AlertCircle
              size={20}
              color="var(--primary)"
            />

            Emergency Dispatch Queue
          </h2>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
            }}
          >

            <button
              onClick={() =>
                setFilterTab("pending")
              }
              className={`btn-secondary ${
                filterTab === "pending"
                  ? "btn-primary"
                  : ""
              }`}
              style={{
                padding: "0.35rem 0.8rem",
                fontSize: "0.85rem",
              }}
            >
              Pending Alerts ({pendingCount})
            </button>

            <button
              onClick={() =>
                setFilterTab("active")
              }
              className={`btn-secondary ${
                filterTab === "active"
                  ? "btn-primary"
                  : ""
              }`}
              style={{
                padding: "0.35rem 0.8rem",
                fontSize: "0.85rem",
              }}
            >
              Active Missions ({activeMissionsCount})
            </button>

            <button
              onClick={() =>
                setFilterTab("completed")
              }
              className={`btn-secondary ${
                filterTab === "completed"
                  ? "btn-primary"
                  : ""
              }`}
              style={{
                padding: "0.35rem 0.8rem",
                fontSize: "0.85rem",
              }}
            >
              Completed ({completedCount})
            </button>

            <button
              onClick={() =>
                setFilterTab("all")
              }
              className={`btn-secondary ${
                filterTab === "all"
                  ? "btn-primary"
                  : ""
              }`}
              style={{
                padding: "0.35rem 0.8rem",
                fontSize: "0.85rem",
              }}
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

              <h4>
                No Emergencies In This Queue
              </h4>

              <p>
                Everything is currently clear
                in the selected emergency status.
              </p>

            </div>

          ) : (

            <table className="app-table">

              <thead>
                <tr>
                  <th>
                    Patient & Phone
                  </th>

                  <th>
                    Emergency Category
                  </th>

                  <th>
                    Pickup Location
                  </th>

                  <th>
                    Assigned Ambulance
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {displayedEmergencies.map(
                  (em) => (

                    <tr key={em._id}>

                      {/* PATIENT */}

                      <td>
                        <strong>
                          {em.patient?.name ||
                            "Anonymous Patient"}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            fontSize: "0.8rem",
                            color: "#0284c7",
                          }}
                        >
                          📞{" "}
                          {em.patient?.phone ||
                            "No phone"}
                        </span>
                      </td>

                      {/* EMERGENCY */}

                      <td>

                        <span
                          style={{
                            fontWeight: 700,
                            color: "#b91c1c",
                          }}
                        >
                          {em.emergencyType}
                        </span>

                        {em.description && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.8rem",
                              color:
                                "var(--text-muted)",
                            }}
                          >
                            {em.description}
                          </span>
                        )}

                      </td>

                      {/* LOCATION */}

                      <td>

                        <span
                          style={{
                            fontSize: "0.85rem",
                            display: "flex",
                            alignItems:
                              "center",
                            gap: "0.3rem",
                          }}
                        >
                          <MapPin
                            size={14}
                            color="#dc2626"
                          />

                          [
                          {
                            em.patientLocation
                              ?.coordinates?.[0]
                              ?.toFixed(4)
                          }
                          ,{" "}
                          {
                            em.patientLocation
                              ?.coordinates?.[1]
                              ?.toFixed(4)
                          }
                          ]
                        </span>

                      </td>

                      {/* AMBULANCE */}

                      <td>

                        {em.ambulance ? (

                          <div>

                            <strong
                              style={{
                                color:
                                  "#0284c7",
                              }}
                            >
                              {
                                em.ambulance
                                  .vehicleNumber
                              }
                            </strong>

                            <span
                              style={{
                                display: "block",
                                fontSize:
                                  "0.75rem",
                                color:
                                  "var(--text-muted)",
                              }}
                            >
                              Driver:{" "}
                              {em.driver?.name ||
                                "Assigned"}
                            </span>

                          </div>

                        ) : (

                          <span
                            style={{
                              color:
                                "var(--text-muted)",
                              fontSize:
                                "0.85rem",
                            }}
                          >
                            None
                          </span>

                        )}

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`status-pill ${em.status}`}
                        >
                          {em.status.replace(
                            "_",
                            " "
                          )}
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >

                          {/* PENDING */}

                          {em.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleAccept(em._id)}
                                disabled={processingId === em._id}
                                className="btn-primary"
                                style={{
                                  padding: "0.4rem 0.75rem",
                                  fontSize: "0.8rem",
                                  background: "#0284c7",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                }}
                                title="Accept request and automatically assign & dispatch ambulance"
                              >
                                <Send size={14} />
                                <span>
                                  {processingId === em._id
                                    ? "Dispatching..."
                                    : "Accept & Dispatch Ambulance"}
                                </span>
                              </button>

                              <button
                                onClick={() => handleReject(em._id)}
                                disabled={processingId === em._id}
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

                          {/* ACCEPTED */}

                          {em.status === "accepted" && (
                            <>
                              {!em.ambulance && (
                                <button
                                  onClick={() => {
                                    setSelectedEmergency(em);
                                    const available = ambulances.find(
                                      (a) => a.status === "available"
                                    );
                                    if (available) {
                                      setSelectedAmbulanceId(available._id);
                                    }
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

                              <button
                                onClick={() => handleCompleteEmergency(em._id)}
                                disabled={processingId === em._id}
                                className="btn-success"
                                style={{
                                  padding: "0.4rem 0.75rem",
                                  fontSize: "0.8rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                }}
                                title="Mark emergency completed manually"
                              >
                                <CheckCircle size={14} />
                                <span>
                                  {processingId === em._id
                                    ? "Completing..."
                                    : "Mark Completed"}
                                </span>
                              </button>
                            </>
                          )}

                          {/* EN ROUTE / AMBULANCE ASSIGNED */}

                          {["ambulance_assigned", "on_the_way"].includes(
                            em.status
                          ) && (
                            <>
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#0284c7",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                }}
                              >
                                <Truck size={14} />
                                En Route
                              </span>

                              <button
                                onClick={() => handleCompleteEmergency(em._id)}
                                disabled={processingId === em._id}
                                className="btn-success"
                                style={{
                                  padding: "0.4rem 0.75rem",
                                  fontSize: "0.8rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                }}
                                title="Mark emergency completed manually and release ambulance"
                              >
                                <CheckCircle size={14} />
                                <span>
                                  {processingId === em._id
                                    ? "Completing..."
                                    : "Mark Completed"}
                                </span>
                              </button>
                            </>
                          )}

                          {/* REACHED PATIENT */}

                          {em.status === "reached_patient" && (
                            <>
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#16a34a",
                                  fontWeight: 600,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                }}
                              >
                                <MapPin size={14} />
                                On Scene
                              </span>

                              <button
                                onClick={() => handleCompleteEmergency(em._id)}
                                disabled={processingId === em._id}
                                className="btn-success"
                                style={{
                                  padding: "0.4rem 0.75rem",
                                  fontSize: "0.8rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                }}
                                title="Complete emergency and release ambulance"
                              >
                                <CheckCircle size={14} />
                                <span>
                                  {processingId === em._id
                                    ? "Completing..."
                                    : "Mark Completed"}
                                </span>
                              </button>
                            </>
                          )}

                          {/* COMPLETED */}

                          {em.status === "completed" && (
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#16a34a",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                              }}
                            >
                              <CheckCircle size={14} />
                              Completed
                            </span>
                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

      {/* ======================================================
          AMBULANCE FLEET
      ====================================================== */}

      <div className="card">

        <div className="card-header">

          <h2>
            <Truck
              size={20}
              color="#0284c7"
            />

            Ambulance Fleet Status (
            {ambulances.length} Units)
          </h2>

          <button
            onClick={() =>
              setShowAddAmbulance(true)
            }
            className="btn-secondary"
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.85rem",
            }}
          >
            <Plus size={14} />
            Add Vehicle
          </button>

        </div>

        <div className="table-responsive">

          {ambulances.length === 0 ? (

            <div className="empty-state">

              <div className="empty-state-icon">
                <Truck size={28} />
              </div>

              <h4>
                No Ambulances Registered
              </h4>

              <p>
                Click "Add Ambulance" to register
                your facility's first vehicle.
              </p>

            </div>

          ) : (

            <table className="app-table">

              <thead>
                <tr>
                  <th>
                    Vehicle Number
                  </th>

                  <th>
                    Driver
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    GPS Coordinates
                  </th>

                  <th>
                    Registered Facility
                  </th>
                </tr>
              </thead>

              <tbody>

                {ambulances.map(
                  (amb) => (

                    <tr key={amb._id}>

                      <td>
                        <strong
                          style={{
                            fontSize:
                              "1rem",
                          }}
                        >
                          {amb.vehicleNumber}
                        </strong>
                      </td>

                      <td>
                        {amb.driver?.name ||
                          "Unassigned"}
                      </td>

                      <td>
                        <span
                          className={`status-pill ${amb.status}`}
                        >
                          {amb.status.replace(
                            "_",
                            " "
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize:
                              "0.85rem",
                            color:
                              "var(--text-muted)",
                          }}
                        >
                          [
                          {
                            amb
                              .currentLocation
                              ?.coordinates?.[0]
                              ?.toFixed(4) ||
                            "0"
                          }
                          ,{" "}
                          {
                            amb
                              .currentLocation
                              ?.coordinates?.[1]
                              ?.toFixed(4) ||
                            "0"
                          }
                          ]
                        </span>
                      </td>

                      <td>
                        {amb.hospital?.name ||
                          "General Fleet"}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

        </div>

      </div>

      {/* ======================================================
          ASSIGN AMBULANCE MODAL
      ====================================================== */}

      {selectedEmergency && (

        <div className="modal-overlay">

          <div className="modal-content">

            <div className="modal-header">

              <h3>
                Dispatch Ambulance Unit
              </h3>

              <button
                onClick={() => {
                  setSelectedEmergency(null);
                  setSelectedAmbulanceId("");
                }}
                className="close-btn"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleAssignAmbulance
              }
            >

              <div className="modal-body">

                <p
                  style={{
                    fontSize: "0.95rem",
                    color:
                      "var(--text-muted)",
                    marginBottom: "1rem",
                  }}
                >
                  Dispatching for:{" "}
                  <strong>
                    {
                      selectedEmergency
                        .emergencyType
                    }
                  </strong>

                  <br />

                  Patient:{" "}
                  {
                    selectedEmergency
                      .patient?.name
                  }

                  {" "}
                  (Phone:{" "}
                  {
                    selectedEmergency
                      .patient?.phone
                  }
                  )
                </p>

                <div className="form-group-modern">

                  <label>
                    Select Available Ambulance
                    & Driver
                  </label>

                  <select
                    className="form-control-modern"
                    value={
                      selectedAmbulanceId
                    }
                    onChange={(e) =>
                      setSelectedAmbulanceId(
                        e.target.value
                      )
                    }
                    required
                  >

                    <option value="">
                      -- Choose an Available
                      Ambulance --
                    </option>

                    {ambulances.map(
                      (a) => (

                        <option
                          key={a._id}
                          value={a._id}
                          disabled={
                            a.status !==
                            "available"
                          }
                        >
                          {a.vehicleNumber} -{" "}
                          {a.driver?.name
                            ? `Driver: ${a.driver.name}`
                            : "Driver: Standby"}{" "}
                          ({a.status})
                        </option>

                      )
                    )}

                  </select>

                </div>

                {ambulances.filter(
                  (a) =>
                    a.status ===
                    "available"
                ).length === 0 && (

                  <p
                    style={{
                      color: "#dc2626",
                      fontSize:
                        "0.85rem",
                    }}
                  >
                    ⚠️ No ambulances are
                    currently marked as
                    "available". Please
                    register an ambulance or
                    wait for active trips to
                    complete.
                  </p>

                )}

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmergency(
                      null
                    );
                    setSelectedAmbulanceId(
                      ""
                    );
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    assigning ||
                    !selectedAmbulanceId
                  }
                  className="btn-primary"
                >
                  <Send size={16} />

                  <span>
                    {assigning
                      ? "Dispatching..."
                      : "Confirm & Dispatch Now"}
                  </span>
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ======================================================
          ADD AMBULANCE MODAL
      ====================================================== */}

      {showAddAmbulance && (

        <div className="modal-overlay">

          <div className="modal-content">

            <div className="modal-header">

              <h3>
                Register New Ambulance Vehicle
              </h3>

              <button
                onClick={() =>
                  setShowAddAmbulance(false)
                }
                className="close-btn"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleCreateAmbulance
              }
            >

              <div className="modal-body">

                <div className="form-group-modern">

                  <label>
                    Ambulance Plate /
                    Vehicle Number
                  </label>

                  <input
                    type="text"
                    className="form-control-modern"
                    placeholder="e.g. GJ-01-AM-5501"
                    value={
                      newVehicleNumber
                    }
                    onChange={(e) =>
                      setNewVehicleNumber(
                        e.target.value
                      )
                    }
                    required
                  />

                </div>

              </div>

              <div className="modal-footer">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddAmbulance(
                      false
                    )
                  }
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    addingAmbulance ||
                    !newVehicleNumber.trim()
                  }
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
