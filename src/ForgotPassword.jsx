import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = "https://ticketing-api-z0gp.onrender.com";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [redirect, setRedirect] = useState(false);

  console.log("🔍 ForgotPassword mounted, initial email:", email);

  const handleSubmit = async e => {
    e.preventDefault();
    console.log("🔔 ForgotPassword.handleSubmit called with:", email);
    setError(""); 
    setMessage("");

    try {
      const res = await axios.post(
        `${API_BASE}/forgot-password`,
        { email }
      );
      console.log("📨 POST /forgot-password response:", res.data);
      setMessage("✅ Reset link sent! You will be redirected shortly...");
      
      setRedirect(true); // ✅ Trigger redirect after showing message
    } catch (err) {
      console.error("❌ forgot-password error:", err);
      setError(err.response?.data?.detail || "Something went wrong");
    }
  };

  useEffect(() => {
    if (redirect) {
      setTimeout(() => {  // ✅ Wait before redirecting
        console.log("⏳ Redirecting to /login after delay...");
        navigate("/login", { replace: true });
      }, 3000); // 3-second delay
    }
  }, [redirect, navigate]);

  return (
    <div className="container py-4">
      <h2>Forgot Password</h2>

      {message && <div className="alert alert-success">{message}</div>}
      {error   && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Your email address</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

                <div className="mt-4 text-center">
          <button type="submit" className="btn btn-primary me-2">
            Send reset link
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/login")}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
