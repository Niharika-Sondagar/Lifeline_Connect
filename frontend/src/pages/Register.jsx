import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import "../auth.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "patient",
    adminSecretKey: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Email format validator
  const validateEmail = (val) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(val?.trim() || "");
  };

  // Phone number validator (supports 10-digit numbers with optional country code)
  const validatePhone = (val) => {
    if (!val) return false;
    const cleaned = val.replace(/[\s\-()]/g, "");
    return /^(\+?[0-9]{1,3})?[0-9]{10}$/.test(cleaned);
  };

  // Name validation based on role
  const validateName = (val, role) => {
    const trimmed = val?.trim() || "";
    const isHospital = role === "hospital";
    const isAdmin = role === "admin";
    if (!trimmed) {
      if (isHospital) return "Hospital name is required.";
      if (isAdmin) return "Admin full name is required.";
      return "Full name is required.";
    }
    if (trimmed.length < 2) {
      return "Name must be at least 2 characters.";
    }
    if (trimmed.length > 70) {
      return "Name cannot exceed 70 characters.";
    }
    if (isHospital) {
      if (!/^[a-zA-Z0-9\s.,'&-]+$/.test(trimmed)) {
        return "Hospital name contains invalid characters.";
      }
    } else {
      if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
        return "Name should only contain letters, spaces, hyphens or dots.";
      }
    }
    return "";
  };

  // Password validation
  const validatePassword = (val) => {
    if (!val) {
      return "Password is required.";
    }
    if (val.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    if (val.length > 50) {
      return "Password cannot exceed 50 characters.";
    }
    return "";
  };

  // Confirm password validation
  const validateConfirmPassword = (val, passwordVal) => {
    if (!val) {
      return "Please confirm your password.";
    }
    if (val !== passwordVal) {
      return "Passwords do not match.";
    }
    return "";
  };

  // Phone validation
  const validatePhoneNumber = (val, label = "Phone number") => {
    const trimmed = val?.trim() || "";
    if (!trimmed) {
      return `${label} is required.`;
    }
    if (!validatePhone(trimmed)) {
      return "Please enter a valid 10-digit phone number.";
    }
    return "";
  };

  // Address validation based on role
  const validateAddress = (val, role) => {
    const trimmed = val?.trim() || "";
    if (role === "hospital") {
      if (!trimmed) {
        return "Hospital address is required.";
      }
      if (trimmed.length < 5) {
        return "Address must be at least 5 characters.";
      }
    } else if (trimmed.length > 0 && trimmed.length < 5) {
      return "Address must be at least 5 characters if provided.";
    }
    return "";
  };

  // Validate single field dynamically
  const validateField = (name, value, currentData = formData) => {
    switch (name) {
      case "name":
        return validateName(value, currentData.role);
      case "email":
        if (!value || !value.trim()) {
          return "Email address is required.";
        }
        if (!validateEmail(value)) {
          return "Please enter a valid email address.";
        }
        return "";
      case "password":
        return validatePassword(value);
      case "confirmPassword":
        return validateConfirmPassword(value, currentData.password);
      case "phone":
        return validatePhoneNumber(value, "Phone number");
      case "address":
        return validateAddress(value, currentData.role);
      case "adminSecretKey":
        if (currentData.role === "admin") {
          const trimmed = value?.trim() || "";
          if (!trimmed) return "Admin security key is required.";
        }
        return "";
      case "emergencyContactName":
        if (currentData.role === "patient") {
          const trimmed = value?.trim() || "";
          if (!trimmed) return "Emergency contact name is required.";
          if (trimmed.length < 2)
            return "Contact name must be at least 2 characters.";
          if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
            return "Contact name should only contain letters.";
          }
        }
        return "";
      case "emergencyContactPhone":
        if (currentData.role === "patient") {
          const trimmed = value?.trim() || "";
          if (!trimmed) {
            return "Emergency contact phone is required.";
          }
          if (!validatePhone(trimmed)) {
            return "Please enter a valid 10-digit phone number.";
          }
          const cleanedEPhone = trimmed.replace(/[\s\-()]/g, "");
          const cleanedUserPhone = (currentData.phone || "").replace(
            /[\s\-()]/g,
            "",
          );
          if (cleanedUserPhone && cleanedEPhone === cleanedUserPhone) {
            return "Emergency contact cannot have the same phone as patient.";
          }
        }
        return "";
      case "emergencyContactRelation":
        if (currentData.role === "patient") {
          const trimmed = value?.trim() || "";
          if (!trimmed) return "Relationship is required.";
          if (trimmed.length < 2)
            return "Relationship must be at least 2 characters.";
        }
        return "";
      default:
        return "";
    }
  };

  // Validate all fields for submission
  const validateAll = (data = formData) => {
    const newErrors = {};

    const nameErr = validateName(data.name, data.role);
    if (nameErr) newErrors.name = nameErr;

    if (!data.email || !data.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!validateEmail(data.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    const passErr = validatePassword(data.password);
    if (passErr) newErrors.password = passErr;

    const confirmPassErr = validateConfirmPassword(
      data.confirmPassword,
      data.password,
    );
    if (confirmPassErr) newErrors.confirmPassword = confirmPassErr;

    const phoneErr = validatePhoneNumber(data.phone, "Phone number");
    if (phoneErr) newErrors.phone = phoneErr;

    const addressErr = validateAddress(data.address, data.role);
    if (addressErr) newErrors.address = addressErr;

    if (data.role === "admin") {
      const adminKeyErr = validateField(
        "adminSecretKey",
        data.adminSecretKey,
        data,
      );
      if (adminKeyErr) newErrors.adminSecretKey = adminKeyErr;
    }

    if (data.role === "patient") {
      const eNameErr = validateField(
        "emergencyContactName",
        data.emergencyContactName,
        data,
      );
      if (eNameErr) newErrors.emergencyContactName = eNameErr;

      const ePhoneErr = validateField(
        "emergencyContactPhone",
        data.emergencyContactPhone,
        data,
      );
      if (ePhoneErr) newErrors.emergencyContactPhone = ePhoneErr;

      const eRelErr = validateField(
        "emergencyContactRelation",
        data.emergencyContactRelation,
        data,
      );
      if (eRelErr) newErrors.emergencyContactRelation = eRelErr;
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: value,
    };
    setFormData(updatedData);

    // If role changed
    if (name === "role") {
      const updatedErrors = { ...errors };
      if (value !== "patient") {
        delete updatedErrors.emergencyContactName;
        delete updatedErrors.emergencyContactPhone;
        delete updatedErrors.emergencyContactRelation;
      }
      if (value !== "admin") {
        delete updatedErrors.adminSecretKey;
      }
      // Revalidate address and name for new role
      const nameErr = validateName(updatedData.name, value);
      if (nameErr) updatedErrors.name = nameErr;
      else delete updatedErrors.name;

      const addrErr = validateAddress(updatedData.address, value);
      if (addrErr) updatedErrors.address = addrErr;
      else delete updatedErrors.address;

      setErrors(updatedErrors);
      return;
    }

    // Live validation if field was touched or currently has error
    if (touched[name] || errors[name]) {
      const error = validateField(name, value, updatedData);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }

    // Keep confirmPassword validation in sync when password changes
    if (
      name === "password" &&
      (touched.confirmPassword || errors.confirmPassword)
    ) {
      const confirmErr = validateConfirmPassword(
        updatedData.confirmPassword,
        value,
      );
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmErr,
      }));
    }

    // Keep emergency contact phone comparison in sync when phone changes
    if (
      name === "phone" &&
      updatedData.role === "patient" &&
      (touched.emergencyContactPhone || errors.emergencyContactPhone)
    ) {
      const ePhoneErr = validateField(
        "emergencyContactPhone",
        updatedData.emergencyContactPhone,
        updatedData,
      );
      setErrors((prev) => ({
        ...prev,
        emergencyContactPhone: ePhoneErr,
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value, formData);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Mark all relevant fields as touched
    const allTouched = {
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      phone: true,
      address: true,
    };

    if (formData.role === "admin") {
      allTouched.adminSecretKey = true;
    }

    if (formData.role === "patient") {
      allTouched.emergencyContactName = true;
      allTouched.emergencyContactPhone = true;
      allTouched.emergencyContactRelation = true;
    }

    setTouched(allTouched);

    const validationErrors = validateAll(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setErrorMsg("Please fix the validation errors before submitting.");
      // Auto-focus the first invalid field
      const firstErrorKey = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorKey}"]`);
      if (element) {
        element.focus();
      }
      return;
    }

    // Structure the data to match your Mongoose User Schema
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: formData.phone.trim(),
      role: formData.role,
      address: formData.address.trim(),
    };

    if (formData.role === "admin") {
      payload.adminSecretKey = formData.adminSecretKey.trim();
    }

    // Only include emergencyContact data if the role is patient
    if (formData.role === "patient") {
      payload.emergencyContact = {
        name: formData.emergencyContactName.trim(),
        phone: formData.emergencyContactPhone.trim(),
        relation: formData.emergencyContactRelation.trim(),
      };
    }

    setLoading(true);
    try {
      await registerUser(payload);

      // Redirect to login with success message
      navigate("/login", {
        state: {
          message:
            formData.role === "admin"
              ? "Administrator account registered successfully! Please log in."
              : "Account registered successfully! Please log in.",
        },
      });
    } catch (error) {
      const serverMsg =
        error.response?.data?.message ||
        error.message ||
        "Registration failed.";
      setErrorMsg(serverMsg);

      // If server returned an email duplication error, highlight email field
      if (serverMsg.toLowerCase().includes("email")) {
        setErrors((prev) => ({
          ...prev,
          email: serverMsg,
        }));
        setTouched((prev) => ({ ...prev, email: true }));
      }
      // If server returned an admin key error, highlight adminSecretKey field
      if (serverMsg.toLowerCase().includes("admin security key")) {
        setErrors((prev) => ({
          ...prev,
          adminSecretKey: serverMsg,
        }));
        setTouched((prev) => ({ ...prev, adminSecretKey: true }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Dynamic labels and placeholders based on selected role
  const getNameLabel = () => {
    if (formData.role === "hospital") return "Hospital Name";
    if (formData.role === "driver") return "Driver Full Name";
    if (formData.role === "admin") return "Admin Full Name";
    return "Full Name";
  };

  const getNamePlaceholder = () => {
    if (formData.role === "hospital") return "e.g. Metro General Hospital";
    if (formData.role === "driver") return "e.g. John Doe";
    if (formData.role === "admin") return "e.g. System Administrator";
    return "e.g. Jane Doe";
  };

  return (
    <div
      className="auth-container"
      style={{ minHeight: "100vh", padding: "40px 20px" }}
    >
      <div className="auth-card register-card" style={{ maxWidth: "500px" }}>
        <div className="auth-header">
          <h1>LifeLine Connect</h1>
          <h2>Create Account</h2>
          <p className="auth-subtitle">
            Register for Hospital Emergency Management System
          </p>
        </div>

        {errorMsg && <div className="auth-alert error">{errorMsg}</div>}

        {/* Hidden inputs to prevent annoying browser autofill/password manager overlays */}
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

          {/* Role Selection */}
          <div className="form-group">
            <label htmlFor="reg-role">
              Register As <span className="required-star">*</span>
            </label>
            <select
              id="reg-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-control-select"
            >
              <option value="patient">Patient</option>
              <option value="hospital">Hospital</option>
              <option value="driver">Ambulance Driver</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          {/* Admin Security Key (Only shown if role is admin) */}
          {formData.role === "admin" && (
            <div
              className="form-group"
              style={{
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                borderRadius: "8px",
                padding: "14px",
              }}
            >
              <label htmlFor="reg-admin-key" style={{ color: "#6d28d9" }}>
                Admin Security Key <span className="required-star">*</span>
              </label>
              <input
                id="reg-admin-key"
                type="password"
                name="adminSecretKey"
                placeholder="Enter secret admin key (Default: ADMIN2026)"
                value={formData.adminSecretKey}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  touched.adminSecretKey && errors.adminSecretKey
                    ? "input-error"
                    : ""
                }
                required
              />
              {touched.adminSecretKey && errors.adminSecretKey ? (
                <span className="field-error-text">
                  {errors.adminSecretKey}
                </span>
              ) : (
                <span className="field-hint-text" style={{ color: "#7c3aed" }}>
                  🔑 Authorization code configured in backend (Default:{" "}
                  <code>ADMIN2026</code>)
                </span>
              )}
            </div>
          )}

          {/* Name */}
          <div className="form-group">
            <label htmlFor="reg-name">
              {getNameLabel()} <span className="required-star">*</span>
            </label>
            <input
              id="reg-name"
              type="text"
              name="name"
              placeholder={getNamePlaceholder()}
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.name && errors.name ? "input-error" : ""}
              required
            />
            {touched.name && errors.name && (
              <span className="field-error-text">{errors.name}</span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="reg-email">
              Email Address <span className="required-star">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="off"
              className={touched.email && errors.email ? "input-error" : ""}
              required
            />
            {touched.email && errors.email && (
              <span className="field-error-text">{errors.email}</span>
            )}
          </div>

          {/* Password with Eye Emoji Toggle */}
          <div className="form-group">
            <label htmlFor="reg-password">
              Password <span className="required-star">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                className={
                  touched.password && errors.password ? "input-error" : ""
                }
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="eye-icon-btn"
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
            {touched.password && errors.password ? (
              <span className="field-error-text">{errors.password}</span>
            ) : (
              <span className="field-hint-text">
                Password must be at least 6 characters
              </span>
            )}
          </div>

          {/* Confirm Password with Eye Emoji Toggle */}
          <div className="form-group">
            <label htmlFor="reg-confirm-password">
              Confirm Password <span className="required-star">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                className={
                  touched.confirmPassword && errors.confirmPassword
                    ? "input-error"
                    : ""
                }
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="eye-icon-btn"
                title={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <span className="field-error-text">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="reg-phone">
              Phone Number <span className="required-star">*</span>
            </label>
            <input
              id="reg-phone"
              type="tel"
              name="phone"
              placeholder="10-digit phone number (e.g. 9876543210)"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.phone && errors.phone ? "input-error" : ""}
              required
            />
            {touched.phone && errors.phone && (
              <span className="field-error-text">{errors.phone}</span>
            )}
          </div>

          {/* Address */}
          <div className="form-group">
            <label htmlFor="reg-address">
              {formData.role === "hospital" ? (
                <>
                  Hospital Address <span className="required-star">*</span>
                </>
              ) : (
                "Address (Optional)"
              )}
            </label>
            <input
              id="reg-address"
              type="text"
              name="address"
              placeholder={
                formData.role === "hospital"
                  ? "Enter complete hospital address"
                  : "Enter your street address, city, etc."
              }
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              className={touched.address && errors.address ? "input-error" : ""}
            />
            {touched.address && errors.address && (
              <span className="field-error-text">{errors.address}</span>
            )}
          </div>

          {/* EMERGENCY CONTACT SECTION - ONLY SHOWN IF ROLE IS PATIENT */}
          {formData.role === "patient" && (
            <div
              className="emergency-section-box"
              style={{
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "15px",
                  color: "#0284c7",
                  marginTop: 0,
                  marginBottom: "12px",
                }}
              >
                🚨 Emergency Contact Details
              </h3>

              {/* Contact Name */}
              <div className="form-group">
                <label htmlFor="reg-em-name">
                  Contact Name <span className="required-star">*</span>
                </label>
                <input
                  id="reg-em-name"
                  type="text"
                  name="emergencyContactName"
                  placeholder="e.g. Sarah Smith"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={
                    touched.emergencyContactName && errors.emergencyContactName
                      ? "input-error"
                      : ""
                  }
                  required
                />
                {touched.emergencyContactName &&
                  errors.emergencyContactName && (
                    <span className="field-error-text">
                      {errors.emergencyContactName}
                    </span>
                  )}
              </div>

              {/* Contact Phone */}
              <div className="form-group">
                <label htmlFor="reg-em-phone">
                  Contact Phone <span className="required-star">*</span>
                </label>
                <input
                  id="reg-em-phone"
                  type="tel"
                  name="emergencyContactPhone"
                  placeholder="10-digit emergency phone number"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={
                    touched.emergencyContactPhone &&
                    errors.emergencyContactPhone
                      ? "input-error"
                      : ""
                  }
                  required
                />
                {touched.emergencyContactPhone &&
                  errors.emergencyContactPhone && (
                    <span className="field-error-text">
                      {errors.emergencyContactPhone}
                    </span>
                  )}
              </div>

              {/* Relationship */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="reg-em-rel">
                  Relationship <span className="required-star">*</span>
                </label>
                <input
                  id="reg-em-rel"
                  type="text"
                  name="emergencyContactRelation"
                  placeholder="e.g. Father, Mother, Spouse, Friend"
                  value={formData.emergencyContactRelation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={
                    touched.emergencyContactRelation &&
                    errors.emergencyContactRelation
                      ? "input-error"
                      : ""
                  }
                  required
                />
                {touched.emergencyContactRelation &&
                  errors.emergencyContactRelation && (
                    <span className="field-error-text">
                      {errors.emergencyContactRelation}
                    </span>
                  )}
              </div>
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="switch-auth">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
