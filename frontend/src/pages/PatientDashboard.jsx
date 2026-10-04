import { useState, useEffect } from "react";
// useState:-  Stores changing data
// useEffect:- performs actions when something changes / when the page loads.

import LocationMap from "../components/LocationMap";
import { useAuth } from "../context/AuthContext";

import {
  createEmergency,
  getAllEmergencies,
  cancelEmergency,
} from "../services/emergencyService";

import { getAllHospitals } from "../services/hospitalService";
import { getNearbyHospitals } from "../services/locationService";
import { updatePatientProfile } from "../services/authService";

import EmergencyStatusTracker from "../components/EmergencyStatusTracker";
import LiveMapSimulation from "../components/LiveMapSimulation";

import {
  ShieldAlert,
  MapPin,
  Building2,
  Phone,
  Clock,
  Activity,
  AlertTriangle,
  Heart,
  Car,
  Baby,
  Stethoscope,
  UserCheck,
  RefreshCw,
  CheckCircle,
  X,
  Hospital,
} from "lucide-react"; // importing ICONS
const EMERGENCY_TYPES = [
  {
    id: "Cardiac Arrest / Chest Pain",
    label: "Cardiac / Chest",
    icon: Heart,
  },
  {
    id: "Road / Traffic Accident",
    label: "Road Accident",
    icon: Car,
  },
  {
    id: "Respiratory / Breathing Difficulty",
    label: "Respiratory",
    icon: Activity,
  },
  {
    id: "Severe Trauma / Bleeding",
    label: "Severe Trauma",
    icon: AlertTriangle,
  },
  {
    id: "Maternity / Pregnancy Emergency",
    label: "Maternity",
    icon: Baby,
  },
  {
    id: "General Critical Illness",
    label: "Critical Illness",
    icon: Stethoscope,
  }, // to create buttons for different emergency types with icons
 ];

export default function PatientDashboard() {
  const { user, updateUser } = useAuth();

  const [emergencies, setEmergencies] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);

  const [hospitals, setHospitals] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);

  const [loadingNearbyHospitals, setLoadingNearbyHospitals] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [activeMapView, setActiveMapView] = useState("gps");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Emergency Form State
  const [emergencyType, setEmergencyType] = useState(
    "Cardiac Arrest / Chest Pain"
  );

  const [description, setDescription] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");

  // GeoJSON format: [longitude, latitude]
  // Ahmedabad fallback coordinates
  const [locationCoords, setLocationCoords] = useState([
    72.5714,
    23.0225,
  ]);

  const [locationName, setLocationName] = useState(
    user?.address || "Current Location"
  );

  const [detectingGps, setDetectingGps] = useState(false);

  // Emergency Contact Edit State
  const [isEditingContact, setIsEditingContact] = useState(false);

  const [contactName, setContactName] = useState(
    user?.emergencyContact?.name || ""
  );

  const [contactPhone, setContactPhone] = useState(
    user?.emergencyContact?.phone || ""
  );

  const [contactRelation, setContactRelation] = useState(
    user?.emergencyContact?.relation || ""
  );


  const fetchData = async () => {
  console.log("🚑 PATIENT fetchData() RUNNING");

  try {
    if (user?.id) {
      const [emRes, hospRes] = await Promise.all([
        getAllEmergencies({ patient: user.id }),
        getAllHospitals().catch(() => ({
          hospitals: [],
        })),
      ]);
       const list = emRes.emergencies || [];
        console.log("🚨 EMERGENCIES:", list);
  const active = list.find(
        (e) =>
          !["completed", "cancelled", "rejected"].includes(e.status)
      );

      console.log("🚨 ACTIVE EMERGENCY:", active);

      console.log("🚑 AMBULANCE:", active?.ambulance);

      console.log(
        "📍 AMBULANCE LOCATION:",
        active?.ambulance?.currentLocation
      );


      setEmergencies(list);

      setActiveEmergency(active || null);

      setHospitals(hospRes.hospitals || []);


      if (active?.ambulance?.currentLocation?.coordinates) {
        console.log(
          "✅ Ambulance GPS coordinates:",
          active.ambulance.currentLocation.coordinates
        );
      } else {
        console.log(
          "⚠️ No ambulance GPS location found in active emergency."
        );
      }
    }
  } catch (err) {
    console.error("❌ Failed to load patient data:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, [user?.id]);


  useEffect(() => {
    if (!activeEmergency) return;

    const interval = setInterval(fetchData, 6000);

    return () => clearInterval(interval);
  }, [activeEmergency?._id, activeEmergency?.status]);


  const handleDetectGPS = () => {
    if (!("geolocation" in navigator)) {
      setErrorMsg("Geolocation is not supported by this browser.");
      return;
    }

    setDetectingGps(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        // GeoJSON format
        setLocationCoords([longitude, latitude]);

        setLocationName(
          `GPS: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`
        );

        setDetectingGps(false);
      },

      (err) => {
        console.warn(
          "GPS lookup denied or unavailable:",
          err.message
        );

        setErrorMsg(
          "Unable to detect your current location. Please allow location permission in your browser."
        );

        setDetectingGps(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleFindNearbyHospitals = async () => {
    try {
      setLoadingNearbyHospitals(true);
      setErrorMsg("");

      // Our application stores:
      // [longitude, latitude]

      const [longitude, latitude] = locationCoords;

      const results = await getNearbyHospitals(
        latitude,
        longitude
      );

      setNearbyHospitals(results);

      if (results.length === 0) {
        setErrorMsg("No hospitals found within 5 km.");
      }
    } catch (error) {
      console.error(
        "Nearby hospital search failed:",
        error
      );

      setErrorMsg(
        "Unable to find nearby hospitals. Please try again."
      );
    } finally {
      setLoadingNearbyHospitals(false);
    }
  };

  const handleSOSSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const payload = {
        patient: user?.id,

        emergencyType,

        description:
          description ||
          `Critical emergency: ${emergencyType}`,

        hospital: selectedHospital || null,

        patientLocation: {
          type: "Point",

          // GeoJSON:
          // [longitude, latitude]
          coordinates: locationCoords,
        },
      };

      await createEmergency(payload);

      setSuccessMsg(
        "🚨 SOS Emergency Dispatched! Contacting emergency teams."
      );

      setDescription("");

      await fetchData();
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          "Failed to dispatch SOS."
      );
    } finally {
      setSubmitting(false);
    }
  };


  const handleCancel = async () => {
    if (!activeEmergency) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this emergency request?"
    );

    if (!confirmed) return;

    setCancelling(true);

    try {
      await cancelEmergency(activeEmergency._id);

      await fetchData();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to cancel emergency."
      );
    } finally {
      setCancelling(false);
    }
  };


  const handleSaveContact = async (e) => {
    e.preventDefault();

    try {
      const updateData = {
        emergencyContact: {
          name: contactName,
          phone: contactPhone,
          relation: contactRelation,
        },
      };

      await updatePatientProfile(user.id, updateData);

      updateUser(updateData);

      setIsEditingContact(false);

      alert("Emergency contact updated successfully!");
    } catch (err) {
      alert(
        "Failed to update emergency contact: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">
        <div>
          <h1>Patient Emergency Portal</h1>

          <p>
            Logged in as <strong>{user?.name}</strong> • Phone:{" "}
            {user?.phone || "N/A"}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <button
            onClick={fetchData}
            className="btn-secondary"
            title="Refresh status"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>

          <a
            href="tel:108"
            className="btn-primary"
            style={{
              textDecoration: "none",
              background: "#b91c1c",
            }}
          >
            <Phone size={16} />
            <span>Emergency: 108</span>
          </a>
        </div>
      </div>

      {/* =====================================================
          ERROR MESSAGE
      ====================================================== */}

      {errorMsg && (
        <div
          className="card"
          style={{
            background: "#fee2e2",
            padding: "1rem",
            color: "#991b1b",
            marginBottom: "1.5rem",
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* =====================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {successMsg && (
        <div
          className="card"
          style={{
            background: "#dcfce7",
            padding: "1rem",
            color: "#166534",
            marginBottom: "1.5rem",
          }}
        >
          {successMsg}
        </div>
      )}

      {/* =====================================================
          ACTIVE EMERGENCY MONITORING
      ====================================================== */}

      {activeEmergency ? (
        <div
          className="card"
          style={{
            border: "2px solid #ef4444",
            boxShadow:
              "0 10px 30px rgba(220, 38, 38, 0.15)",
          }}
        >
          <div
            className="card-header"
            style={{ background: "#fee2e2" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span
                className="radar-ping"
                style={{
                  position: "relative",
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#dc2626",
                  display: "inline-block",
                }}
              />

              <h2 style={{ color: "#991b1b" }}>
                Active Emergency Request In Progress
              </h2>
            </div>

            <span
              className={`status-pill ${activeEmergency.status}`}
            >
              {activeEmergency.status.replace("_", " ")}
            </span>
          </div>

          <div className="card-body">

            <EmergencyStatusTracker
              status={activeEmergency.status}
            />

            {/* Map View Mode Switcher */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "1.25rem 0 0.5rem 0",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <MapPin size={18} color="#dc2626" />
                <strong style={{ fontSize: "1rem", color: "var(--navy)" }}>
                  Live Dispatch Tracking Map
                </strong>
                {activeEmergency.ambulance && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontWeight: 700,
                    }}
                  >
                    🚑 Driver Live Beacon Active
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  type="button"
                  onClick={() => setActiveMapView("gps")}
                  className={`btn-secondary ${
                    activeMapView === "gps" ? "btn-primary" : ""
                  }`}
                  style={{
                    padding: "0.3rem 0.75rem",
                    fontSize: "0.8rem",
                    background: activeMapView === "gps" ? "#0284c7" : "",
                  }}
                >
                  🗺️ Live GPS Map
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapView("radar")}
                  className={`btn-secondary ${
                    activeMapView === "radar" ? "btn-primary" : ""
                  }`}
                  style={{
                    padding: "0.3rem 0.75rem",
                    fontSize: "0.8rem",
                    background: activeMapView === "radar" ? "#0284c7" : "",
                  }}
                >
                  📡 Radar Telemetry
                </button>
              </div>
            </div>

            {/* Live GPS Map vs Radar View */}
            {activeMapView === "gps" ? (
              <LocationMap
                coordinates={
                  activeEmergency.patientLocation?.coordinates ||
                  locationCoords
                }
                ambulanceLocation={activeEmergency.ambulance?.currentLocation}
                ambulance={activeEmergency.ambulance}
                driver={
                  activeEmergency.driver ||
                  activeEmergency.ambulance?.driver
                }
                hospital={activeEmergency.hospital}
                activeStatus={activeEmergency.status}
                height="380px"
              />
            ) : (
              <LiveMapSimulation
                patientLocation={activeEmergency.patientLocation}
                hospital={activeEmergency.hospital}
                ambulance={activeEmergency.ambulance}
                status={activeEmergency.status}
              />
            )}

            {/* Emergency Details */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1rem",
                marginTop: "1.5rem",
              }}
            >

              {/* Emergency Type */}

              <div
                style={{
                  background: "var(--bg-muted)",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Emergency Type
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    color: "#991b1b",
                    marginTop: "0.25rem",
                  }}
                >
                  {activeEmergency.emergencyType}
                </strong>
              </div>

              {/* Hospital */}

              <div
                style={{
                  background: "var(--bg-muted)",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Receiving Medical Facility
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    color: "var(--navy)",
                    marginTop: "0.25rem",
                  }}
                >
                  {activeEmergency.hospital?.name ||
                    "Auto-Routing to Nearest Trauma ER"}
                </strong>

                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {activeEmergency.hospital?.phone || ""}
                </span>
              </div>

              {/* Ambulance */}

              <div
                style={{
                  background: "var(--bg-muted)",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Assigned Ambulance
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    color: "#0284c7",
                    marginTop: "0.25rem",
                  }}
                >
                  {activeEmergency.ambulance
                    ?.vehicleNumber ||
                    "Dispatching Unit..."}
                </strong>

                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Driver:{" "}
                  {activeEmergency.driver?.name ||
                    "Pending allocation"}
                </span>
              </div>

              {/* Requested At */}

              <div
                style={{
                  background: "var(--bg-muted)",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Requested At
                </span>

                <strong
                  style={{
                    display: "block",
                    fontSize: "1rem",
                    color: "var(--navy)",
                    marginTop: "0.25rem",
                  }}
                >
                  {new Date(
                    activeEmergency.requestedAt
                  ).toLocaleTimeString()}
                </strong>

                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {new Date(
                    activeEmergency.requestedAt
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Cancel Emergency */}

            {["pending", "accepted"].includes(
              activeEmergency.status
            ) && (
              <div
                style={{
                  marginTop: "1.5rem",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="btn-secondary"
                  style={{
                    color: "#dc2626",
                    borderColor: "#fca5a5",
                  }}
                >
                  <X size={16} />

                  <span>
                    {cancelling
                      ? "Cancelling..."
                      : "Cancel Emergency Request"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =====================================================
           INSTANT SOS CARD
        ====================================================== */

        <div className="sos-banner-card">
          <div className="sos-content">
            <h2>
              <ShieldAlert
                size={30}
                className="animate-pulse-red"
              />

              Need Urgent Medical Assistance?
            </h2>

            <p>
              Press SOS to immediately alert the nearest
              emergency dispatch and medical trauma facilities.
              Your coordinates and medical contact will be
              instantly relayed.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSOSSubmit}
            disabled={submitting}
            className="sos-trigger-btn"
          >
            <ShieldAlert size={26} />

            <span>
              {submitting
                ? "Dispatching SOS..."
                : "1-CLICK INSTANT SOS"}
            </span>
          </button>
        </div>
      )}

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="content-grid-3">

        {/* ===================================================
            LEFT COLUMN
        ==================================================== */}

        <div className="card">
          <div className="card-header">
            <h2>
              <Activity
                size={20}
                color="var(--primary)"
              />

              Customized Emergency Request
            </h2>
          </div>

          <div className="card-body">
            <form onSubmit={handleSOSSubmit}>

              {/* Emergency Type */}

              <div className="form-group-modern">
                <label>
                  Select Emergency Category
                </label>

                <div className="emergency-type-grid">
                  {EMERGENCY_TYPES.map((type) => {
                    const Icon = type.icon;

                    const isSelected =
                      emergencyType === type.id;

                    return (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() =>
                          setEmergencyType(type.id)
                        }
                        className={`emergency-type-btn ${
                          isSelected ? "selected" : ""
                        }`}
                      >
                        <Icon
                          size={22}
                          color={
                            isSelected
                              ? "#dc2626"
                              : "var(--text-muted)"
                          }
                        />

                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Hospital */}

              <div className="form-group-modern">
                <label>
                  Preferred Destination Hospital (Optional)
                </label>

                <select
                  className="form-control-modern"
                  value={selectedHospital}
                  onChange={(e) =>
                    setSelectedHospital(e.target.value)
                  }
                >
                  <option value="">
                    Auto-Assign Nearest Emergency Facility
                    (Recommended)
                  </option>

                  {hospitals.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name} - {h.address} ({h.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* =================================================
                  PICKUP LOCATION
              ================================================== */}

              <div className="form-group-modern">

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.4rem",
                  }}
                >
                  <label style={{ margin: 0 }}>
                    Pickup Coordinates & Address
                  </label>

                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    disabled={detectingGps}
                    className="btn-secondary"
                    style={{
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.8rem",
                    }}
                  >
                    <MapPin
                      size={14}
                      color="#dc2626"
                    />

                    <span>
                      {detectingGps
                        ? "Acquiring GPS..."
                        : "Detect Current GPS"}
                    </span>
                  </button>
                </div>

                {/* Location Name */}

                <input
                  type="text"
                  className="form-control-modern"
                  value={locationName}
                  onChange={(e) =>
                    setLocationName(e.target.value)
                  }
                  placeholder="e.g. 104 Sunset Boulevard, City Center"
                  required
                />

                {/* Coordinates */}

                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: "0.5rem",
                    display: "block",
                  }}
                >
                  Broadcast Coordinates: [
                  {locationCoords[0]}, {locationCoords[1]}]
                </span>

                {/* =================================================
                    REAL LEAFLET MAP
                ================================================== */}

                <LocationMap
                  coordinates={locationCoords}
                  nearbyHospitals={nearbyHospitals}
                  ambulanceLocation={
                    activeEmergency?.ambulance?.currentLocation || null
                  }
                  ambulance={activeEmergency?.ambulance}
                  driver={
                    activeEmergency?.driver ||
                    activeEmergency?.ambulance?.driver
                  }
                  hospital={activeEmergency?.hospital}
                  activeStatus={activeEmergency?.status}
                />
                {/* =================================================
                    FIND NEARBY HOSPITALS
                ================================================== */}

                <button
                  type="button"
                  onClick={handleFindNearbyHospitals}
                  disabled={loadingNearbyHospitals}
                  className="btn-secondary"
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Building2 size={16} />

                  {loadingNearbyHospitals
                    ? "Finding Nearby Hospitals..."
                    : "Find Nearby Hospitals"}
                </button>

                {/* =================================================
                    NEARBY HOSPITAL RESULTS
                ================================================== */}

                {nearbyHospitals.length > 0 && (
                  <div style={{ marginTop: "1rem" }}>
                    <h3
                      style={{
                        marginBottom: "0.75rem",
                      }}
                    >
                      Nearby Hospitals
                    </h3>

                    {nearbyHospitals.map((hospital) => (
                      <div
                        key={hospital.id}
                        style={{
                          padding: "1rem",
                          marginBottom: "0.75rem",
                          border:
                            "1px solid #e5e7eb",
                          borderRadius: "10px",
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Hospital
                            size={18}
                            color="#dc2626"
                          />

                          <strong>
                            {hospital.name}
                          </strong>
                        </div>

                        <div
                          style={{
                            fontSize: "0.85rem",
                            marginTop: "0.5rem",
                          }}
                        >
                          📍 {hospital.address}
                        </div>

                        {hospital.phone && (
                          <div
                            style={{
                              fontSize: "0.85rem",
                              marginTop: "0.3rem",
                              color: "#0284c7",
                            }}
                          >
                            📞 {hospital.phone}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            marginTop: "0.3rem",
                          }}
                        >
                          GPS:{" "}
                          {hospital.latitude},{" "}
                          {hospital.longitude}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================== */}

              <div className="form-group-modern">
                <label>
                  Emergency Symptoms & Patient Details
                  (Optional)
                </label>

                <textarea
                  className="form-control-modern"
                  rows={3}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe patient condition, conscious state, bleeding, or landmarks for the driver..."
                />
              </div>

              {/* =================================================
                  SUBMIT
              ================================================== */}

              <button
                type="submit"
                disabled={
                  submitting || !!activeEmergency
                }
                className="btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.85rem",
                  fontSize: "1rem",
                }}
              >
                <ShieldAlert size={18} />

                <span>
                  {activeEmergency
                    ? "An Emergency Is Currently Active"
                    : submitting
                    ? "Submitting Dispatch Request..."
                    : "Dispatch Emergency Ambulance"}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* =====================================================
            RIGHT COLUMN
        ====================================================== */}

        <div>

          {/* ===================================================
              EMERGENCY CONTACT
          ==================================================== */}

          <div className="card">
            <div className="card-header">
              <h2>
                <UserCheck
                  size={20}
                  color="#0284c7"
                />

                Emergency Contact
              </h2>

              <button
                onClick={() =>
                  setIsEditingContact(
                    !isEditingContact
                  )
                }
                className="btn-secondary"
                style={{
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.8rem",
                }}
              >
                {isEditingContact
                  ? "Cancel"
                  : "Edit"}
              </button>
            </div>

            <div className="card-body">

              {isEditingContact ? (
                <form onSubmit={handleSaveContact}>

                  <div className="form-group-modern">
                    <label>
                      Contact Person Name
                    </label>

                    <input
                      type="text"
                      className="form-control-modern"
                      value={contactName}
                      onChange={(e) =>
                        setContactName(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>
                      Contact Phone
                    </label>

                    <input
                      type="tel"
                      className="form-control-modern"
                      value={contactPhone}
                      onChange={(e) =>
                        setContactPhone(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="form-group-modern">
                    <label>
                      Relationship
                    </label>

                    <input
                      type="text"
                      className="form-control-modern"
                      value={contactRelation}
                      onChange={(e) =>
                        setContactRelation(
                          e.target.value
                        )
                      }
                      placeholder="e.g. Spouse, Parent, Sibling"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    Save Emergency Contact
                  </button>
                </form>
              ) : (
                <div>

                  <div
                    style={{
                      marginBottom: "1rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Primary Contact
                    </span>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "1.1rem",
                        color: "var(--navy)",
                      }}
                    >
                      {user?.emergencyContact?.name ||
                        "Not set yet"}
                    </strong>
                  </div>

                  <div
                    style={{
                      marginBottom: "1rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Phone Number
                    </span>

                    <strong
                      style={{
                        display: "block",
                        fontSize: "1rem",
                        color: "#0284c7",
                      }}
                    >
                      {user?.emergencyContact?.phone ||
                        "No phone added"}
                    </strong>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Relationship
                    </span>

                    <span
                      style={{
                        display: "block",
                        fontSize: "0.95rem",
                        color: "var(--navy)",
                      }}
                    >
                      {user?.emergencyContact?.relation ||
                        "Not specified"}
                    </span>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* ===================================================
              SAFETY PROTOCOL
          ==================================================== */}

          <div
            className="card"
            style={{
              background: "#f8fafc",
            }}
          >
            <div className="card-header">
              <h2>
                <AlertTriangle
                  size={18}
                  color="#d97706"
                />

                While Waiting for Paramedics
              </h2>
            </div>

            <div
              className="card-body"
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              <p>
                • <strong>Stay Calm:</strong> Keep the
                patient still and reassured.
              </p>

              <p>
                • <strong>Clear Access:</strong> Ensure
                main gate and doorways are unlocked for
                paramedics.
              </p>

              <p>
                • <strong>Prepare Documents:</strong> Keep
                patient ID and current medications readily
                accessible.
              </p>

              <p>
                • <strong>Keep Line Free:</strong> Ambulance
                dispatchers may call for immediate
                first-aid instructions.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* =====================================================
          EMERGENCY HISTORY
      ====================================================== */}

      <div className="card">
        <div className="card-header">
          <h2>
            <Clock
              size={20}
              color="var(--navy)"
            />

            Emergency History & Records
          </h2>

          <span
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            Total Requests: {emergencies.length}
          </span>
        </div>

        <div className="table-responsive">

          {emergencies.length === 0 ? (
            <div className="empty-state">

              <div className="empty-state-icon">
                <CheckCircle size={28} />
              </div>

              <h4>
                No Emergency Requests Recorded
              </h4>

              <p>
                You have not made any emergency requests
                on this account yet.
              </p>
            </div>
          ) : (
            <table className="app-table">

              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Emergency Category</th>
                  <th>Hospital</th>
                  <th>Ambulance</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {emergencies.map((em) => (
                  <tr key={em._id}>

                    <td>
                      <strong>
                        {new Date(
                          em.requestedAt ||
                            em.createdAt
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
                          em.requestedAt ||
                            em.createdAt
                        ).toLocaleTimeString()}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                        }}
                      >
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
                          {em.description.substring(
                            0,
                            45
                          )}
                          {em.description.length > 45
                            ? "..."
                            : ""}
                        </span>
                      )}
                    </td>

                    <td>
                      {em.hospital?.name ||
                        "Auto-assigned ER"}
                    </td>

                    <td>
                      {em.ambulance?.vehicleNumber ||
                        "None"}
                    </td>

                    <td>
                      <span
                        className={`status-pill ${em.status}`}
                      >
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

    </div>
  );
}

