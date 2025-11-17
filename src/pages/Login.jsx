// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import { login, forgotPassword } from "../api/auth";
import "./Login.css";

const Login = ({ username, setUsername, setStudentID, setEmail }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const { setToken } = useAuth();
  const navigate = useNavigate();

  // Handle login form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
     /* const payload ={
        studentID: username,
        password : password
      }*/
      const response = await login({username, password});     
      if (response?.access_token) {
        const { access_token, student_id, email } = response;

        // Save to localStorage
        localStorage.setItem("token", access_token);
        localStorage.setItem("student_id", student_id);
        localStorage.setItem("email", email);

        setToken(access_token);
        setStudentID(student_id);
        setEmail(email);

        navigate("/", { replace: true });
      }
     else {
        setMessage("⚠️ Login failed: Invalid response from server.");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      setMessage("❌ Login failed: Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage("");
    if (!forgotEmail) {
      setForgotMessage("⚠️ Please enter your registered email or username.");
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword({ email: forgotEmail });

      if (res?.success) {
        setForgotMessage("✅ Password reset link has been sent to your email.");
      } else {
        setForgotMessage("⚠️ Failed to send reset link. Please try again.");
      }
    } catch (error) {
      console.error("❌ Forgot password error:", error);
      setForgotMessage("❌ Error: Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">Welcome Back 👋</h2>
        <p className="login-subtitle">Sign in to continue to your portal</p>

        {message && (
          <div
            className={`login-message ${
              message.includes("failed") ? "error" : "success"
            }`}
          >
            {message}
          </div>
        )}

        <label className="login-label">Login ID</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
          placeholder="Username or Email"
          required
        />

        <label className="login-label">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          placeholder="Password"
          required
        />

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="login-footer">
          <button
            type="button"
            className="forgot-link"
            onClick={() => setForgotVisible(true)}
          >
            Forgot password?
          </button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {forgotVisible && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Forgot Password</h3>
            <p>Enter your registered email or username to reset your password.</p>

            <form onSubmit={handleForgotPassword}>
              <input
                type="text"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="login-input"
                placeholder="Email or Username"
              />
              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            {forgotMessage && (
              <div
                className={`login-message ${
                  forgotMessage.includes("⚠️") || forgotMessage.includes("❌")
                    ? "error"
                    : "success"
                }`}
              >
                {forgotMessage}
              </div>
            )}

            <button
              className="close-button"
              onClick={() => {
                setForgotVisible(false);
                setForgotMessage("");
                setForgotEmail("");
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
