import { useState, useEffect } from "react";
import { getAllEmergencies } from "../services/emergencyService";
import { getAllHospitals } from "../services/hospitalService";
import { getAllAmbulances } from "../services/ambulanceService";
import { getAllUsers, deleteUser } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import {
  Activity,
  Building2,
  Truck,
  Users,
  AlertCircle,
  RefreshCw,
  Trash2,
  Filter,
} from "lucide-react";

export default function AdminDashboard() {
  const { user: currentUser } = useAuth();

  const [emergencies, setEmergencies] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("emergencies");
  const [searchFilter, setSearchFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [deletingUserId, setDeletingUserId] = useState(null);

  const loadAllNetworkData = async () => {
    try {
      const [emRes, hospRes, ambRes, userRes] = await Promise.all([
        getAllEmergencies().catch((err) => {
          console.error("Emergency API error:", err);
          return { emergencies: [] };
        }),

        getAllHospitals().catch((err) => {
          console.error("Hospital API error:", err);
          return { hospitals: [] };
        }),

        getAllAmbulances().catch((err) => {
          console.error("Ambulance API error:", err);
          return { ambulances: [] };
        }),

        getAllUsers().catch((err) => {
          console.error("Users API error:", err);
          return { users: [] };
        }),
      ]);

      setEmergencies(emRes.emergencies || []);
      setHospitals(hospRes.hospitals || []);
      setAmbulances(ambRes.ambulances || []);
      setUsers(userRes.users || (Array.isArray(userRes) ? userRes : []));
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
  const totalUsers = users.length;

  // Search/filter helpers
  const normalizedTerm = searchFilter.trim().toLowerCase();

  const filteredEmergencies = emergencies.filter((e) => {
    if (!normalizedTerm) return true;
    return [
      e.patient?.name,
      e.patient?.phone,
      e.hospital?.name,
      e.emergencyType,
      e.status,
    ].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(normalizedTerm),
    );
  });

  const filteredHospitals = hospitals.filter((h) => {
    if (!normalizedTerm) return true;
    return [h.name, h.address, h.phone, h.user?.name, h.user?.email].some(
      (value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedTerm),
    );
  });

  const filteredAmbulances = ambulances.filter((a) => {
    if (!normalizedTerm) return true;
    return [a.vehicleNumber, a.hospital?.name, a.driver?.name, a.status].some(
      (value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedTerm),
    );
  });

  // Role counts for badges
  const roleCounts = {
    all: users.length,
    patient: users.filter((u) => u.role?.toLowerCase() === "patient").length,
    hospital: users.filter((u) => u.role?.toLowerCase() === "hospital").length,
    driver: users.filter((u) => u.role?.toLowerCase() === "driver").length,
    admin: users.filter((u) => u.role?.toLowerCase() === "admin").length,
  };

  // Filtered users by role and search query
  const filteredUsers = users.filter((u) => {
    // 1. Role filter
    if (userRoleFilter && userRoleFilter !== "all") {
      if (u.role?.toLowerCase() !== userRoleFilter.toLowerCase()) {
        return false;
      }
    }

    // 2. Search query filter
    if (!normalizedTerm) return true;
    return [u.name, u.email, u.phone, u.role, u.address].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(normalizedTerm),
    );
  });

  const handleDeleteUser = async (user) => {
    if (!user?._id || deletingUserId) return;

    const currentId = currentUser?.id || currentUser?._id;
    const currentEmail = currentUser?.email;
    const isCurrentAdmin =
      (currentId && String(user._id) === String(currentId)) ||
      (currentEmail &&
        user.email?.toLowerCase() === currentEmail?.toLowerCase());

    if (isCurrentAdmin) {
      window.alert("You cannot delete the currently logged-in administrator account.");
      return;
    }

    const userName = user.name || user.email || "this user";
    const userRole = (user.role || "user").toUpperCase();

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete [${userRole}] ${userName}?\n\nThis will also remove all associated records (hospitals, vehicle assignments, and emergency requests).`,
    );

    if (!confirmed) return;

    try {
      setDeletingUserId(user._id);
      await deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      // Reload network data to keep related counts in sync
      loadAllNetworkData();
      window.alert(`User "${userName}" deleted successfully.`);
    } catch (err) {
      console.error("Failed to delete user:", err);
      window.alert(
        err.response?.data?.message || err.message || "Failed to delete user.",
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>System Administration & Health Monitor</h1>
          <p>
            Global oversight of emergency response pipelines, fleet telemetry,
            hospital partners, and registered system accounts.
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
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
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

        <button
          onClick={() => setActiveTab("users")}
          className={`btn-secondary ${activeTab === "users" ? "btn-primary" : ""}`}
        >
          <Users size={16} />
          <span>Users Directory ({users.length})</span>
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
                <h4>
                  {searchFilter
                    ? "No Matching Emergencies"
                    : "No Emergency Records"}
                </h4>
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
          <div
            className="card-header"
            style={{ flexWrap: "wrap", gap: "1rem" }}
          >
            <h2>
              <Building2 size={20} color="#0284c7" />
              Connected Hospitals Directory
            </h2>
            <input
              type="text"
              className="form-control-modern"
              placeholder="Filter by name, address, phone..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ maxWidth: "320px" }}
            />
          </div>

          <div className="table-responsive">
            {filteredHospitals.length === 0 ? (
              <div className="empty-state">
                <h4>
                  {searchFilter
                    ? "No Matching Hospitals"
                    : "No Hospitals Registered"}
                </h4>
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
                  {filteredHospitals.map((h) => (
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
          <div
            className="card-header"
            style={{ flexWrap: "wrap", gap: "1rem" }}
          >
            <h2>
              <Truck size={20} color="#16a34a" />
              Emergency Ambulance Fleets
            </h2>
            <input
              type="text"
              className="form-control-modern"
              placeholder="Filter by vehicle plate, hospital, driver, status..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ maxWidth: "320px" }}
            />
          </div>

          <div className="table-responsive">
            {filteredAmbulances.length === 0 ? (
              <div className="empty-state">
                <h4>
                  {searchFilter
                    ? "No Matching Ambulances"
                    : "No Ambulances Found In Network"}
                </h4>
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
                  {filteredAmbulances.map((a) => (
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

      {/* TAB 4: USERS DIRECTORY */}
      {activeTab === "users" && (
        <div className="card">
          <div
            className="card-header"
            style={{ flexWrap: "wrap", gap: "1rem", alignItems: "center" }}
          >
            <div>
              <h2 style={{ marginBottom: "0.25rem" }}>
                <Users size={20} color="#7c3aed" />
                Registered System Accounts
              </h2>
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Manage system users, filter by specific roles, and remove inactive or unauthorized accounts.
              </span>
            </div>

            {/* Role Filter & Search Controls */}
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Filter size={16} color="var(--text-muted)" />
                <select
                  className="form-control-modern"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  style={{ minWidth: "160px" }}
                >
                  <option value="all">All Roles ({roleCounts.all})</option>
                  <option value="patient">Patients ({roleCounts.patient})</option>
                  <option value="hospital">Hospitals ({roleCounts.hospital})</option>
                  <option value="driver">Drivers ({roleCounts.driver})</option>
                  <option value="admin">Admins ({roleCounts.admin})</option>
                </select>
              </div>

              <input
                type="text"
                className="form-control-modern"
                placeholder="Search name, email, phone..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ minWidth: "220px" }}
              />
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div
            style={{
              padding: "0.85rem 1.5rem 0.25rem",
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              borderBottom: "1px solid var(--border)",
              background: "#fafafa",
            }}
          >
            {[
              { key: "all", label: "All Users", count: roleCounts.all, color: "#475569" },
              { key: "patient", label: "Patients", count: roleCounts.patient, color: "#0284c7" },
              { key: "hospital", label: "Hospitals", count: roleCounts.hospital, color: "#d97706" },
              { key: "driver", label: "Drivers", count: roleCounts.driver, color: "#16a34a" },
              { key: "admin", label: "Admins", count: roleCounts.admin, color: "#7c3aed" },
            ].map((item) => {
              const isActive = userRoleFilter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setUserRoleFilter(item.key)}
                  style={{
                    border: `1px solid ${isActive ? item.color : "var(--border)"}`,
                    backgroundColor: isActive ? item.color : "#ffffff",
                    color: isActive ? "#ffffff" : "var(--text-main)",
                    borderRadius: "20px",
                    padding: "0.3rem 0.85rem",
                    fontSize: "0.82rem",
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{item.label}</span>
                  <span
                    style={{
                      background: isActive ? "rgba(255, 255, 255, 0.25)" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#475569",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}

            {(userRoleFilter !== "all" || searchFilter) && (
              <button
                type="button"
                onClick={() => {
                  setUserRoleFilter("all");
                  setSearchFilter("");
                }}
                style={{
                  background: "transparent",
                  border: "1px dashed #f87171",
                  color: "#dc2626",
                  borderRadius: "20px",
                  padding: "0.3rem 0.75rem",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="table-responsive">
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <h4>
                  {searchFilter || userRoleFilter !== "all"
                    ? `No ${userRoleFilter !== "all" ? userRoleFilter : ""} users matching filter criteria`
                    : "No Registered Users Found"}
                </h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Try resetting or adjusting the role filter and search keywords.
                </p>
                {(searchFilter || userRoleFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoleFilter("all");
                      setSearchFilter("");
                    }}
                    className="btn-secondary"
                    style={{ marginTop: "0.75rem" }}
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Address / Jurisdiction</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((user) => {
                    const currentId = currentUser?.id || currentUser?._id;
                    const currentEmail = currentUser?.email;
                    const isCurrentLoggedInUser =
                      (currentId && String(user._id) === String(currentId)) ||
                      (currentEmail &&
                        user.email?.toLowerCase() === currentEmail?.toLowerCase());
                    const isDeletingThis = deletingUserId === user._id;

                    return (
                      <tr key={user._id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <strong>{user.name || "Unnamed User"}</strong>
                            {isCurrentLoggedInUser && (
                              <span
                                style={{
                                  fontSize: "0.72rem",
                                  backgroundColor: "#f3e8ff",
                                  color: "#7e22ce",
                                  padding: "2px 6px",
                                  borderRadius: "10px",
                                  fontWeight: 700,
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              display: "block",
                            }}
                          >
                            ID: {user._id}
                          </span>
                        </td>

                        <td>{user.email || "-"}</td>

                        <td>
                          <strong style={{ color: "#0284c7" }}>
                            {user.phone || "-"}
                          </strong>
                        </td>

                        <td>
                          <span className={`role-tag ${user.role || ""}`}>
                            {user.role || "user"}
                          </span>
                        </td>

                        <td>{user.address || "-"}</td>

                        <td>
                          {isCurrentLoggedInUser ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                fontSize: "0.8rem",
                                color: "#7c3aed",
                                background: "#f3e8ff",
                                padding: "0.35rem 0.7rem",
                                borderRadius: "4px",
                                fontWeight: 600,
                              }}
                            >
                              Current Admin
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              disabled={isDeletingThis}
                              className="btn-secondary"
                              style={{
                                color: "#dc2626",
                                borderColor: "#fecaca",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                opacity: isDeletingThis ? 0.6 : 1,
                                cursor: isDeletingThis ? "wait" : "pointer",
                              }}
                              title={`Delete ${user.name || user.email}`}
                            >
                              <Trash2 size={15} />
                              <span>{isDeletingThis ? "Deleting..." : "Delete"}</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
