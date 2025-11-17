// src/pages/Setting.jsx
import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  Save,
  Eye,
  EyeOff,
  Shield,
  User,
  Bell,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import styles from "./Settings.module.css";
import { changePassword, changeEmail } from "../api/auth";

const initialStrength = { score: 0, label: "", percent: 0, color: "" };

const Setting = ({ student_id, username, email: initialEmail, setEmail, token }) => {
  const [form, setForm] = useState({
    student_id: student_id || "",
    currentEmail: initialEmail || "",
    newEmail: "",
    password: "",
    confirmPassword: "",
    notifications: true,
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', text }
  const [strength, setStrength] = useState(initialStrength);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("password"); // 'email' | 'password' | 'notifications'

  useEffect(() => {
    // Keep local state synced if parent changes initialEmail
    setForm((f) => ({ ...f, currentEmail: initialEmail || "" }));
  }, [initialEmail]);

  // small notification helper
  const notify = (type, text, timeout = 4000) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), timeout);
  };

  const emailValid = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || "").trim());

  const evaluateStrength = (pwd = "") => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const mapping = {
      0: { label: "Too Short", color: "#ef4444" },
      1: { label: "Very Weak", color: "#ef4444" },
      2: { label: "Weak", color: "#f97316" },
      3: { label: "Fair", color: "#f59e0b" },
      4: { label: "Good", color: "#3b82f6" },
      5: { label: "Strong", color: "#10b981" },
    };

    const m = mapping[Math.min(score, 5)];
    setStrength({ score, label: m.label, percent: (score / 5) * 100, color: m.color });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (name === "password") evaluateStrength(value);
  };

  // === Password ===
  const handlePasswordSubmit = async (e) => {
    e && e.preventDefault();

    if (!form.password) return notify("error", "Please enter your new password.");
    if (form.password.length < 8) return notify("error", "Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword) return notify("error", "Passwords do not match.");

    setLoading(true);
    try {
      await changePassword({ student_id: form.student_id, password: form.password }, token);
      notify("success", "Password updated successfully.");
      setForm((p) => ({ ...p, password: "", confirmPassword: "" }));
      setStrength(initialStrength);
    } catch (err) {
      console.error("Password update failed:", err);
      notify("error", err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  // === Email ===
  const handleEmailSubmit = async (e) => {
    e && e.preventDefault();

    if (!form.newEmail) return notify("error", "Please enter your new email address.");
    if (!emailValid(form.newEmail)) return notify("error", "Please enter a valid email address.");
    if (form.newEmail.trim() === form.currentEmail.trim()) return notify("error", "New email must be different.");

    setLoading(true);
    try {
      await changeEmail({ student_id: form.student_id, new_email: form.newEmail.trim() }, token);
      setForm((p) => ({ ...p, currentEmail: form.newEmail.trim(), newEmail: "" }));
      setEmail && setEmail(form.newEmail.trim());
      localStorage.setItem("email", form.newEmail.trim());
      notify("success", "Email updated. Please verify your new email.");
    } catch (err) {
      console.error("Email update failed:", err);
      notify("error", err.message || "Failed to update email.");
    } finally {
      setLoading(false);
    }
  };

  // === Notifications ===
  const handleNotificationSubmit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    try {
      // send to server if needed - here simulated
      await new Promise((res) => setTimeout(res, 700));
      notify("success", "Notification preferences saved.");
    } catch (err) {
      notify("error", "Failed to save preferences.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Notification / Toast */}
      {notification && (
        <div
          className={`${styles.toast} ${notification.type === "success" ? styles.success : styles.error}`}
          role="status"
          aria-live="polite"
        >
          {notification.type === "success" ? (
            <CheckCircle className={styles.toastIcon} />
          ) : (
            <AlertCircle className={styles.toastIcon} />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Shield />
          </div>
          <div>
            <h1 className={styles.title}>Account Settings</h1>
            <p className={styles.subtitle}>Manage your account, security and notification preferences.</p>
          </div>
        </div>
      </header>

      <main className={styles.card}>
        {/* Account Info */}
        <section className={styles.accountInfo}>
          <div className={styles.sectionTitleRow}>
            <User className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Account Information</h2>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.infoLabel}>Student ID</label>
              <div className={styles.infoValue}>{form.student_id || username || "—"}</div>
            </div>

            <div className={styles.infoItem}>
              <label className={styles.infoLabel}>Email</label>
              <div className={styles.infoValue}>{form.currentEmail || "—"}</div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === "email" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("email")}
            aria-pressed={activeTab === "email"}
          >
            <Mail className={styles.tabIcon} />
            Change Email
          </button>
          <button
            className={`${styles.tab} ${activeTab === "password" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("password")}
            aria-pressed={activeTab === "password"}
          >
            <Lock className={styles.tabIcon} />
            Change Password
          </button>
          <button
            className={`${styles.tab} ${activeTab === "notifications" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("notifications")}
            aria-pressed={activeTab === "notifications"}
          >
            <Bell className={styles.tabIcon} />
            Notifications
          </button>
        </nav>

        {/* Email Form */}
        {activeTab === "email" && (
          <section className={styles.formSection}>
            <div className={styles.formHeader}>
              <Mail className={styles.sectionIconLarge} />
              <div>
                <h3 className={styles.formTitle}>Email Settings</h3>
                <p className={styles.formSubtitle}>Update the email address associated with your account.</p>
              </div>
            </div>

            <form onSubmit={handleEmailSubmit} className={styles.form}>
              <label className={styles.label}>Current Email</label>
              <input className={styles.input} value={form.currentEmail} disabled />

              <label htmlFor="newEmail" className={styles.label}>New Email</label>
              <input
                id="newEmail"
                name="newEmail"
                type="email"
                className={styles.input}
                value={form.newEmail}
                onChange={handleChange}
                placeholder="you@example.com"
                aria-invalid={form.newEmail && !emailValid(form.newEmail)}
              />

              {form.newEmail && !emailValid(form.newEmail) && (
                <p className={styles.fieldError}>Please enter a valid email address.</p>
              )}

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  disabled={loading || !form.newEmail || !emailValid(form.newEmail) || form.newEmail.trim() === form.currentEmail.trim()}
                  className={`${styles.btn} ${styles.primary}`}
                >
                  <Save className={styles.btnIcon} />
                  Update Email
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Password Form */}
        {activeTab === "password" && (
          <section className={styles.formSection}>
            <div className={styles.formHeader}>
              <Lock className={styles.sectionIconLarge} />
              <div>
                <h3 className={styles.formTitle}>Security Settings</h3>
                <p className={styles.formSubtitle}>Change your password periodically to keep your account secure.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className={styles.form}>
              <label htmlFor="password" className={styles.label}>New Password</label>
              <div className={styles.passwordRow}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={styles.input}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {/* Strength */}
              {form.password && (
                <>
                  <div className={styles.strengthRow}>
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthFill}
                        style={{ width: `${strength.percent}%`, background: strength.color }}
                      />
                    </div>
                    <div className={styles.strengthLabel}>{strength.label}</div>
                  </div>

                  <ul className={styles.requirements}>
                    <li className={form.password.length >= 8 ? styles.met : ""}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(form.password) && /[a-z]/.test(form.password) ? styles.met : ""}>Upper & lower case letters</li>
                    <li className={/\d/.test(form.password) ? styles.met : ""}>At least one number</li>
                    <li className={/[^A-Za-z0-9]/.test(form.password) ? styles.met : ""}>Special character</li>
                  </ul>
                </>
              )}

              <label htmlFor="confirmPassword" className={styles.label}>Confirm New Password</label>
              <div className={styles.passwordRow}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  className={styles.input}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirm ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className={styles.fieldError}>Passwords do not match.</p>
              )}

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={handlePasswordSubmit}
                  disabled={loading || !form.password || form.password !== form.confirmPassword}
                  className={`${styles.btn} ${styles.primary}`}
                >
                  <Save className={styles.btnIcon} />
                  Update Password
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <section className={styles.formSection}>
            <div className={styles.formHeader}>
              <Bell className={styles.sectionIconLarge} />
              <div>
                <h3 className={styles.formTitle}>Notification Preferences</h3>
                <p className={styles.formSubtitle}>Control how you receive updates and alerts.</p>
              </div>
            </div>

            <form onSubmit={handleNotificationSubmit} className={styles.form}>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  name="notifications"
                  checked={form.notifications}
                  onChange={handleChange}
                  className={styles.toggleInput}
                />
                <span className={styles.toggleText}>Email notifications for course updates & announcements</span>
              </label>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  onClick={handleNotificationSubmit}
                  disabled={loading}
                  className={`${styles.btn} ${styles.secondary}`}
                >
                  <Save className={styles.btnIcon} />
                  Save Preferences
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

export default Setting;
