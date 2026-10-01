import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import "../auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Verification states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const location = useLocation();
  const [successMsg, setSuccessMsg] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (val) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val);
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (successMsg) setSuccessMsg("");
    if (val && !validateEmail(val)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (successMsg) setSuccessMsg("");
    if (val && val.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (successMsg) setSuccessMsg("");

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(email, password);
      login(data);

      const userRole = data?.user?.role || data?.role;

      if (userRole === "admin") {
        navigate("/admin-dashboard");
      } else if (userRole === "hospital") {
        navigate("/hospital-dashboard");
      } else if (userRole === "driver") {
        navigate("/driver-dashboard");
      } else if (userRole === "patient") {
        navigate("/patient-dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Invalid credentials or login failed.";
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(forgotEmail)) {
      setForgotMessage("Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);
    setForgotMessage("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setForgotMessage("Password reset link has been sent to your email.");
      setForgotEmail("");
    } catch {
      setForgotMessage("Failed to send reset link. Try again later.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>LifeLine Connect</h1>
          <h2>Sign In</h2>
          <p className="auth-subtitle">Hospital Emergency Management System</p>
        </div>

        {errorMsg && <div className="auth-alert error">{errorMsg}</div>}
        {successMsg && <div className="auth-alert success">{successMsg}</div>}

        {/* Hidden dummy fields to prevent automated browser password managers from triggering popups */}
        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <input
            type="text"
            style={{ display: "none" }}
            autoComplete="username"
          />
          <input
            type="password"
            style={{ display: "none" }}
            autoComplete="current-password"
          />

          {/* Email Input */}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              autoComplete="off"
              name="random_email_field_xyz"
              className={emailError ? "input-error" : ""}
              required
            />
            {emailError && (
              <span className="field-error-text">{emailError}</span>
            )}
          </div>

          {/* Password Input with Eye Emoji Toggle */}
          <div className="form-group">
            <div className="password-header-flex">
              <label>Password</label>
              <button
                type="button"
                className="forgot-link-btn"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotMessage("");
                }}
              >
                Forgot Password?
              </button>
            </div>

            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="new-password"
                name="random_password_field_xyz"
                className={passwordError ? "input-error" : ""}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eye-icon-btn"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
            {passwordError && (
              <span className="field-error-text">{passwordError}</span>
            )}
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="auth-button"
            disabled={
              loading || !!emailError || !!passwordError || !email || !password
            }
          >
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        <p className="switch-auth">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>

      {/* Forgot Password Modal Popup */}
      {showForgotModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Reset Password</h3>
            <p>
              Enter your account email address below, and we will send you
              instructions to reset your password.
            </p>

            <form onSubmit={handleForgotSubmit}>
              <div className="form-group" style={{ textAlign: "left" }}>
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              {forgotMessage && (
                <div
                  className={`auth-alert ${forgotMessage.includes("sent") ? "success" : "error"}`}
                >
                  {forgotMessage}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="modal-cancel-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="auth-button"
                  style={{ width: "auto", padding: "10px 18px", margin: 0 }}
                >
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
