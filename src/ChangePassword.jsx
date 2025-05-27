import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ChangePassword() {
  const [search]      = useSearchParams();
  const paramEmail    = search.get('email') || '';
  const [email, setEmail] = useState(paramEmail);
  const [success, setSuccess] = useState(false);


  const navigate      = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        'https://ticketing-api-z0gp.onrender.com/change-password',
        { email, new_password: password }
      );
      // show the green “done” popup…
      setSuccess(true);
      //...then wait 2 seconds and send them to login
      setTimeout(() => navigate('/login', { replace: true }), 2000)
     
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2>Set Your New Password</h2>

      {success && (
  <div className="alert alert-success">
    Your password has been reset successfully!
  </div>
)}


      {/* Email input always shown; prefilled if you came from login */}
      <div className="mb-3">
        <label>Email address</label>
        <input
          type="email"
          className="form-control"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>New Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label>Confirm Password</label>
          <input
            type="password"
            className="form-control"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving…' : 'Set Password'}
        </button>
      </form>
    </div>
  );
}
