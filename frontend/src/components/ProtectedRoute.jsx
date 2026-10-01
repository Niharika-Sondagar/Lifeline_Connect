import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their own role dashboard if unauthorized for this route
    if (user.role === "hospital") {
      return <Navigate to="/hospital-dashboard" replace />;
    } else if (user.role === "driver") {
      return <Navigate to="/driver-dashboard" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/patient-dashboard" replace />;
    }
  }

  return children;
}
