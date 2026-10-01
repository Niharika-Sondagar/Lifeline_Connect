import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Building2,
  Truck,
  RefreshCw,
  Radio,
} from "lucide-react";

export default function LiveMapSimulation({
  patientLocation,
  hospital,
  ambulance,
  status,
}) {
  const [eta, setEta] = useState(12);

  // Dynamic ETA countdown simulation when ambulance is en route
  useEffect(() => {
    if (status === "on_the_way") {
      setEta(9);
      const timer = setInterval(() => {
        setEta((prev) => (prev > 2 ? prev - 1 : 2));
      }, 15000);
      return () => clearInterval(timer);
    } else if (status === "reached_patient") {
      setEta(0);
    } else if (status === "ambulance_assigned") {
      setEta(14);
    } else {
      setEta(15);
    }
  }, [status]);

  const pCoords = patientLocation?.coordinates || [72.5714, 23.0225];
  const aCoords = ambulance?.currentLocation?.coordinates || [
    pCoords[0] + 0.015,
    pCoords[1] + 0.012,
  ];

  return (
    <div className="tracking-display">
      <div className="radar-grid" />

      {/* Top Telemetry Header */}
      <div className="tracking-info-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: status === "completed" ? "#10b981" : "#ef4444",
            }}
            className={status !== "completed" ? "animate-pulse-red" : ""}
          />
          <div>
            <span
              style={{
                fontSize: "0.85rem",
                color: "#94a3b8",
                display: "block",
              }}
            >
              Live Telemetry & GPS Dispatch
            </span>
            <strong style={{ fontSize: "0.95rem", color: "#f8fafc" }}>
              {status === "on_the_way"
                ? "Ambulance En Route to Patient"
                : status === "reached_patient"
                  ? "Ambulance On Scene"
                  : status === "ambulance_assigned"
                    ? "Vehicle Dispatched"
                    : "Awaiting Dispatch"}
            </strong>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <span
            style={{ fontSize: "0.8rem", color: "#94a3b8", display: "block" }}
          >
            Estimated Arrival
          </span>
          <strong style={{ fontSize: "1.2rem", color: "#38bdf8" }}>
            {status === "reached_patient"
              ? "ARRIVED"
              : status === "completed"
                ? "COMPLETED"
                : `~${eta} mins`}
          </strong>
        </div>
      </div>

      {/* Radar Map Visual Stage */}
      <div className="radar-visual">
        {/* Hospital Node */}
        <div className="radar-node">
          <div className="radar-node-icon hospital">
            <Building2 size={24} />
          </div>
          <div style={{ textAlign: "center", marginTop: "0.4rem" }}>
            <span
              style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}
            >
              {hospital?.name || "Medical Center"}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                display: "block",
              }}
            >
              Base Station
            </span>
          </div>
        </div>

        <div className="radar-path">
          <div
            style={{
              position: "absolute",
              top: "-8px",
              left:
                status === "on_the_way"
                  ? "50%"
                  : status === "reached_patient"
                    ? "90%"
                    : "20%",
              transform: "translateX(-50%)",
              transition: "left 1.5s ease",
            }}
          >
            <Radio size={16} color="#38bdf8" className="animate-pulse-red" />
          </div>
        </div>

        {/* Ambulance Node */}
        {ambulance && (
          <div className="radar-node">
            <div className="radar-node-icon ambulance">
              <Truck size={24} />
              <div
                className="radar-ping"
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "rgba(56, 189, 248, 0.4)",
                }}
              />
            </div>
            <div style={{ textAlign: "center", marginTop: "0.4rem" }}>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: "#38bdf8",
                }}
              >
                {ambulance.vehicleNumber || "AMB-108"}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#94a3b8",
                  display: "block",
                }}
              >
                GPS: [{aCoords[0].toFixed(3)}, {aCoords[1].toFixed(3)}]
              </span>
            </div>
          </div>
        )}

        <div className="radar-path" />

        {/* Patient Location Node */}
        <div className="radar-node">
          <div className="radar-node-icon patient">
            <MapPin size={24} />
            <div
              className="radar-ping"
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(239, 68, 68, 0.5)",
              }}
            />
          </div>
          <div style={{ textAlign: "center", marginTop: "0.4rem" }}>
            <span
              style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fca5a5" }}
            >
              Patient Pickup
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "#94a3b8",
                display: "block",
              }}
            >
              GPS: [{pCoords[0].toFixed(3)}, {pCoords[1].toFixed(3)}]
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.8rem",
          color: "#94a3b8",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: "0.75rem",
        }}
      >
        <span>Satellite Coordinates Synchronized</span>
        <span>Emergency Unit Priority: Code Red</span>
      </div>
    </div>
  );
}
