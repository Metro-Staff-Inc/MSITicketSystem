import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = "https://ticketing-api-z0gp.onrender.com";

export default function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ✅ Grab ?email= from the URL on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailFromURL = params.get("email");
    if (emailFromURL) {
      setEmail(emailFromURL);
    }
  }, [location.search]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await axios.post(`${API_BASE}/change-password`, {
        email,
        new_password: newPassword,
      });

      setMessage("✅ Password changed successfully!");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      console.error("Password change error:", err);
      setError("❌ Failed to change password.");
    }
  };

  return (
    <div className="container py-4">
      <h2>Reset Your Password</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Email address</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled // 🔒 You can lock this if you only allow email from the link
          />
        </div>

        <div className="mb-3">
          <label>New Password</label>
          <input
            type="password"
            className="form-control"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="d-grid gap-2 mt-3">
          <button type="submit" className="btn btn-success">
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
}
