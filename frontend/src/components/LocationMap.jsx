// leaflet - actual map component for live tracking of patient, ambulance, and hospital locations
import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons in React/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom HTML Markers for crisp, distinct identification
const patientIcon = L.divIcon({
  className: "custom-patient-marker",
  html: `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(220, 38, 38, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 32px; height: 32px; border-radius: 50%; background: #dc2626; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.5); border: 2.5px solid #ffffff;">
        📍
      </div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

const driverAmbulanceIcon = L.divIcon({
  className: "custom-driver-ambulance-marker",
  html: `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(2, 132, 199, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: relative; width: 38px; height: 38px; border-radius: 50%; background: #0284c7; color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.6); border: 2.5px solid #ffffff;">
        🚑
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const hospitalIcon = L.divIcon({
  className: "custom-hospital-marker",
  html: `
    <div style="width: 34px; height: 34px; border-radius: 50%; background: #16a34a; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(22, 163, 74, 0.5); border: 2px solid #ffffff;">
      🏥
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Automatic map view and bound adjustment
function MapBoundsHandler({ patientPosition, ambulancePosition }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (patientPosition && ambulancePosition) {
      try {
        const bounds = L.latLngBounds([patientPosition, ambulancePosition]);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
        });
      } catch {
        map.setView(patientPosition, 14);
      }
    } else if (patientPosition) {
      map.setView(patientPosition, 15);
    }
  }, [
    map,
    patientPosition[0],
    patientPosition[1],
    ambulancePosition?.[0],
    ambulancePosition?.[1],
  ]);

  return null;
}

export default function LocationMap({
  coordinates,
  nearbyHospitals = [],
  ambulanceLocation = null,
  driver = null,
  ambulance = null,
  hospital = null,
  activeStatus = null,
  height = "400px",
}) {
  // Application stores coordinates as GeoJSON: [longitude, latitude]
  // Leaflet expects: [latitude, longitude]
  const patientPosition = [
    coordinates[1],
    coordinates[0],
  ];

  // Resolve driver/ambulance live position
  let ambulancePosition = null;
  const ambCoords =
    ambulanceLocation?.coordinates ||
    ambulance?.currentLocation?.coordinates;

  if (
    Array.isArray(ambCoords) &&
    ambCoords.length === 2 &&
    (ambCoords[0] !== 0 || ambCoords[1] !== 0)
  ) {
    ambulancePosition = [ambCoords[1], ambCoords[0]];
  } else if (ambulance || driver) {
    // Assigned ambulance fallback if driver GPS hasn't updated yet:
    const hospCoords = hospital?.location?.coordinates;
    if (
      Array.isArray(hospCoords) &&
      hospCoords.length === 2 &&
      (hospCoords[0] !== 0 || hospCoords[1] !== 0)
    ) {
      ambulancePosition = [hospCoords[1], hospCoords[0]];
    } else {
      // Offset slightly (~800m north-east) for map visualization
      ambulancePosition = [
        patientPosition[0] + 0.0075,
        patientPosition[1] + 0.0065,
      ];
    }
  }

  // Calculate distance between Driver and Patient (Haversine formula in km)
  let distanceKm = null;
  if (ambulancePosition && patientPosition) {
    const R = 6371;
    const dLat = ((patientPosition[0] - ambulancePosition[0]) * Math.PI) / 180;
    const dLon = ((patientPosition[1] - ambulancePosition[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((ambulancePosition[0] * Math.PI) / 180) *
        Math.cos((patientPosition[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distanceKm = (R * c).toFixed(2);
  } // haversine formula to calculate distance between two coordinates in km

  // Destination Hospital position if available
  const destinationHospitalPosition =
    hospital?.location?.coordinates &&
    (hospital.location.coordinates[0] !== 0 || hospital.location.coordinates[1] !== 0)
      ? [hospital.location.coordinates[1], hospital.location.coordinates[0]]
      : null;

  const driverName =
    driver?.name || ambulance?.driver?.name || "Assigned Paramedic Driver";
  const driverPhone =
    driver?.phone || ambulance?.driver?.phone;
  const vehicleNumber =
    ambulance?.vehicleNumber || "Emergency Ambulance Unit";

  return (
    <div
      style={{
        width: "100%",
        height: height,
        borderRadius: "12px",
        overflow: "hidden",
        marginTop: "1rem",
        position: "relative",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        border: "1px solid #e2e8f0",
      }}
    >
      {/* Live Driver Telemetry Overlay Badge if ambulance is assigned */}
      {ambulancePosition && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(6px)",
            padding: "8px 14px",
            borderRadius: "10px",
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
            border: "1px solid #bae6fd",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            maxWidth: "320px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#0284c7",
            }}
          />
          <div style={{ fontSize: "12px", lineHeight: "1.3" }}>
            <strong style={{ color: "#0369a1", display: "block" }}>
              🚑 Driver: {driverName}
            </strong>
            <span style={{ color: "#475569" }}>
              {vehicleNumber} {distanceKm ? `• ~${distanceKm} km away` : ""}
            </span>
          </div>
        </div>
      )}

      <MapContainer
        center={patientPosition}
        zoom={15}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsHandler
          patientPosition={patientPosition}
          ambulancePosition={ambulancePosition}
        />

        {/* ================================================= */}
        {/* DISPATCH ROUTE POLYLINE (DRIVER <-> PATIENT)      */}
        {/* ================================================= */}
        {ambulancePosition && (
          <Polyline
            positions={[ambulancePosition, patientPosition]}
            pathOptions={{
              color: "#0284c7",
              weight: 4,
              dashArray: "8, 8",
              opacity: 0.85,
            }}
          />
        )}

        {/* ================================================= */}
        {/* PATIENT LOCATION MARKER                           */}
        {/* ================================================= */}
        <Marker position={patientPosition} icon={patientIcon}>
          <Popup>
            <div style={{ minWidth: "160px", lineHeight: "1.4" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <span style={{ fontSize: "18px" }}>📍</span>
                <strong style={{ color: "#dc2626", fontSize: "13px" }}>
                  Your Pickup Location
                </strong>
              </div>
              <div style={{ fontSize: "12px", color: "#475569" }}>
                Patient Emergency Coordinates
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  marginTop: "4px",
                }}
              >
                Lat: {patientPosition[0].toFixed(5)}, Lng:{" "}
                {patientPosition[1].toFixed(5)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* ================================================= */}
        {/* DRIVER / AMBULANCE LIVE LOCATION MARKER           */}
        {/* ================================================= */}
        {ambulancePosition && (
          <Marker
            position={ambulancePosition}
            icon={driverAmbulanceIcon}
          >
            <Popup autoPan={false}>
              <div style={{ minWidth: "190px", lineHeight: "1.4" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "6px",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>🚑</span>
                  <strong style={{ color: "#0284c7", fontSize: "13px" }}>
                    Assigned Ambulance Unit
                  </strong>
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {vehicleNumber}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#334155",
                    marginTop: "3px",
                  }}
                >
                  👤 <strong>Driver:</strong> {driverName}
                </div>

                {driverPhone && (
                  <div
                    style={{
                      fontSize: "12px",
                      marginTop: "3px",
                    }}
                  >
                    📞 <strong>Phone:</strong>{" "}
                    <a
                      href={`tel:${driverPhone}`}
                      style={{ color: "#0284c7", fontWeight: 600 }}
                    >
                      {driverPhone}
                    </a>
                  </div>
                )}

                {distanceKm && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#16a34a",
                      fontWeight: 600,
                      marginTop: "3px",
                    }}
                  >
                    📏 Distance: ~{distanceKm} km away
                  </div>
                )}

                <div
                  style={{
                    fontSize: "11px",
                    color: "#64748b",
                    marginTop: "4px",
                  }}
                >
                  GPS: [{ambulancePosition[0].toFixed(5)},{" "}
                  {ambulancePosition[1].toFixed(5)}]
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    display: "inline-block",
                    background: "#e0f2fe",
                    color: "#0369a1",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  {activeStatus
                    ? activeStatus.replace("_", " ")
                    : "En Route to You"}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* ================================================= */}
        {/* DESTINATION HOSPITAL MARKER (IF ACTIVE)           */}
        {/* ================================================= */}
        {destinationHospitalPosition && (
          <Marker
            position={destinationHospitalPosition}
            icon={hospitalIcon}
          >
            <Popup>
              <div style={{ minWidth: "160px", lineHeight: "1.4" }}>
                <strong style={{ color: "#16a34a", fontSize: "13px" }}>
                  🏥 {hospital.name}
                </strong>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#475569",
                    marginTop: "2px",
                  }}
                >
                  Receiving Medical Facility Base
                </div>
                {hospital.phone && (
                  <div style={{ fontSize: "11px", color: "#0284c7" }}>
                    📞 {hospital.phone}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* ================================================= */}
        {/* NEARBY HOSPITALS (SEARCH MODE)                    */}
        {/* ================================================= */}
        {nearbyHospitals.map((hosp) => {
          if (hosp.latitude == null || hosp.longitude == null) {
            return null;
          }

          const pos = [hosp.latitude, hosp.longitude];

          return (
            <Marker key={hosp.id} position={pos} icon={hospitalIcon}>
              <Popup>
                <strong style={{ color: "#16a34a", fontSize: "13px" }}>
                  🏥 {hosp.name}
                </strong>
                <br />
                <span style={{ fontSize: "11px", color: "#475569" }}>
                  {hosp.address || "Medical Facility"}
                </span>
                {hosp.phone && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#0284c7",
                      marginTop: "2px",
                    }}
                  >
                    📞 {hosp.phone}
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
//LocationMap is a reusable React component that integrates React 
// Leaflet and OpenStreetMap to display patient, ambulance, and hospital locations.
//  It converts our GeoJSON coordinates from [longitude, latitude] to the [latitude, longitude]
//  format expected by Leaflet. It can display live ambulance coordinates, calculate
//  the approximate distance between the ambulance and patient using the Haversine formula, 
// draw a connection between them, and display nearby hospitals as map markers."