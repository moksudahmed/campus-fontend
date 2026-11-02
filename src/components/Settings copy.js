// src/pages/Setting.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Save,
  Shield,
  User,
} from "lucide-react";

import styles from "../styles/Settings.module.css";
import { changeEmail, changePassword } from "../services/authService";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const INITIAL_STRENGTH = {
  score: 0,
  label: "",
  percent: 0,
  color: "",
};

const INITIAL_FORM = {
  student_id: "",
  currentEmail: "",
  newEmail: "",
  password: "",
  confirmPassword: "",
  notifications: true,
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const isValidEmail = (email = "") => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const getPasswordStrength = (password = "") => {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const strengthMap = {
    0: {
      label: "Too Short",
      color: "#ef4444",
    },
    1: {
      label: "Very Weak",
      color: "#ef4444",
    },
    2: {
      label: "Weak",
      color: "#f97316",
    },
    3: {
      label: "Fair",
      color: "#f59e0b",
    },
    4: {
      label: "Good",
      color: "#3b82f6",
    },
    5: {
      label: "Strong",
      color: "#10b981",
    },
  };

  const result = strengthMap[Math.min(score, 5)];

  return {
    score,
    label: result.label,
    percent: (score / 5) * 100,
    color: result.color,
  };
};

/* -------------------------------------------------------------------------- */
/* Toast                                                                      */
/* -------------------------------------------------------------------------- */

function Toast({ notification }) {
  if (!notification) {
    return null;
  }

  const isSuccess = notification.type === "success";

  return (
    <div
      className={`${styles.toast} ${
        isSuccess ? styles.success : styles.error
      }`}
      role="status"
      aria-live="polite"
    >
      {isSuccess ? (
        <CheckCircle className={styles.toastIcon} />
      ) : (
        <AlertCircle className={styles.toastIcon} />
      )}

      <span>{notification.text}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page Header                                                                */
/* -------------------------------------------------------------------------- */

function SettingsHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.headerIcon}>
          <Shield size={24} />
        </div>

        <div>
          <h1 className={styles.title}>Account Settings</h1>

          <p className={styles.subtitle}>
            Manage your account, security and notification preferences.
          </p>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Account Information                                                        */
/* -------------------------------------------------------------------------- */

function AccountInformation({ studentId, email }) {
  return (
    <section className={styles.accountInfo}>
      <div className={styles.sectionTitleRow}>
        <User className={styles.sectionIcon} />

        <h2 className={styles.sectionTitle}>Account Information</h2>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <label className={styles.infoLabel}>Student ID</label>

          <div className={styles.infoValue}>
            {studentId || "—"}
          </div>
        </div>

        <div className={styles.infoItem}>
          <label className={styles.infoLabel}>Email</label>

          <div className={styles.infoValue}>
            {email || "—"}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Settings Tabs                                                              */
/* -------------------------------------------------------------------------- */

function SettingsTabs({ activeTab, onChange }) {
  const tabs = [
    {
      id: "email",
      label: "Change Email",
      icon: Mail,
    },
    {
      id: "password",
      label: "Change Password",
      icon: Lock,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
  ];

  return (
    <nav
      className={styles.tabs}
      aria-label="Account settings sections"
    >
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`${styles.tab} ${
            activeTab === id ? styles.activeTab : ""
          }`}
          onClick={() => onChange(id)}
          aria-pressed={activeTab === id}
        >
          <Icon className={styles.tabIcon} size={18} />

          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Form Header                                                                */
/* -------------------------------------------------------------------------- */

function FormHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className={styles.formHeader}>
      <Icon className={styles.sectionIconLarge} />

      <div>
        <h3 className={styles.formTitle}>{title}</h3>

        <p className={styles.formSubtitle}>{subtitle}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Password Field                                                             */
/* -------------------------------------------------------------------------- */

function PasswordField({
  id,
  name,
  label,
  value,
  onChange,
  showPassword,
  onToggle,
  placeholder,
}) {
  return (
    <>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      <div className={styles.passwordRow}>
        <input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          className={styles.input}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={
            name === "password"
              ? "new-password"
              : "new-password"
          }
        />

        <button
          type="button"
          className={styles.iconButton}
          onClick={onToggle}
          aria-label={
            showPassword ? `Hide ${label}` : `Show ${label}`
          }
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Password Strength                                                          */
/* -------------------------------------------------------------------------- */

function PasswordStrength({ password, strength }) {
  if (!password) {
    return null;
  }

  return (
    <>
      <div className={styles.strengthRow}>
        <div className={styles.strengthBar}>
          <div
            className={styles.strengthFill}
            style={{
              width: `${strength.percent}%`,
              backgroundColor: strength.color,
            }}
          />
        </div>

        <div className={styles.strengthLabel}>
          {strength.label}
        </div>
      </div>

      <ul className={styles.requirements}>
        <li
          className={
            password.length >= 8 ? styles.met : ""
          }
        >
          At least 8 characters
        </li>

        <li
          className={
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password)
              ? styles.met
              : ""
          }
        >
          Upper & lower case letters
        </li>

        <li
          className={
            /\d/.test(password) ? styles.met : ""
          }
        >
          At least one number
        </li>

        <li
          className={
            /[^A-Za-z0-9]/.test(password)
              ? styles.met
              : ""
          }
        >
          Special character
        </li>
      </ul>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Email Settings                                                             */
/* -------------------------------------------------------------------------- */

function EmailSettings({
  form,
  loading,
  onChange,
  onSubmit,
}) {
  const newEmail = form.newEmail.trim();

  const emailError =
    Boolean(newEmail) && !isValidEmail(newEmail);

  const sameEmail =
    Boolean(newEmail) &&
    newEmail.toLowerCase() ===
      form.currentEmail.trim().toLowerCase();

  const disabled =
    loading ||
    !newEmail ||
    emailError ||
    sameEmail;

  return (
    <section className={styles.formSection}>
      <FormHeader
        icon={Mail}
        title="Email Settings"
        subtitle="Update the email address associated with your account."
      />

      <form
        onSubmit={onSubmit}
        className={styles.form}
      >
        <label
          htmlFor="currentEmail"
          className={styles.label}
        >
          Current Email
        </label>

        <input
          id="currentEmail"
          type="email"
          className={styles.input}
          value={form.currentEmail}
          disabled
        />

        <label
          htmlFor="newEmail"
          className={styles.label}
        >
          New Email
        </label>

        <input
          id="newEmail"
          name="newEmail"
          type="email"
          className={styles.input}
          value={form.newEmail}
          onChange={onChange}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={emailError}
        />

        {emailError && (
          <p className={styles.fieldError}>
            Please enter a valid email address.
          </p>
        )}

        {sameEmail && !emailError && (
          <p className={styles.fieldError}>
            New email must be different from your current email.
          </p>
        )}

        <div className={styles.actionsRow}>
          <button
            type="submit"
            disabled={disabled}
            className={`${styles.btn} ${styles.primary}`}
          >
            <Save
              className={styles.btnIcon}
              size={17}
            />

            {loading ? "Updating..." : "Update Email"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Password Settings                                                          */
/* -------------------------------------------------------------------------- */

function PasswordSettings({
  form,
  loading,
  strength,
  showPassword,
  showConfirm,
  onChange,
  onTogglePassword,
  onToggleConfirm,
  onSubmit,
}) {
  const passwordsDoNotMatch =
    Boolean(form.confirmPassword) &&
    form.password !== form.confirmPassword;

  const disabled =
    loading ||
    !form.password ||
    form.password.length < 8 ||
    form.password !== form.confirmPassword;

  return (
    <section className={styles.formSection}>
      <FormHeader
        icon={Lock}
        title="Security Settings"
        subtitle="Change your password periodically to keep your account secure."
      />

      <form
        onSubmit={onSubmit}
        className={styles.form}
      >
        <PasswordField
          id="password"
          name="password"
          label="New Password"
          value={form.password}
          onChange={onChange}
          showPassword={showPassword}
          onToggle={onTogglePassword}
          placeholder="Enter new password"
        />

        <PasswordStrength
          password={form.password}
          strength={strength}
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm New Password"
          value={form.confirmPassword}
          onChange={onChange}
          showPassword={showConfirm}
          onToggle={onToggleConfirm}
          placeholder="Confirm new password"
        />

        {passwordsDoNotMatch && (
          <p className={styles.fieldError}>
            Passwords do not match.
          </p>
        )}

        <div className={styles.actionsRow}>
          <button
            type="submit"
            disabled={disabled}
            className={`${styles.btn} ${styles.primary}`}
          >
            <Save
              className={styles.btnIcon}
              size={17}
            />

            {loading
              ? "Updating..."
              : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Notification Settings                                                      */
/* -------------------------------------------------------------------------- */

function NotificationSettings({
  enabled,
  loading,
  onChange,
  onSubmit,
}) {
  return (
    <section className={styles.formSection}>
      <FormHeader
        icon={Bell}
        title="Notification Preferences"
        subtitle="Control how you receive updates and alerts."
      />

      <form
        onSubmit={onSubmit}
        className={styles.form}
      >
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            name="notifications"
            checked={enabled}
            onChange={onChange}
            className={styles.toggleInput}
          />

          <span className={styles.toggleText}>
            Email notifications for course updates &
            announcements
          </span>
        </label>

        <div className={styles.actionsRow}>
          <button
            type="submit"
            disabled={loading}
            className={`${styles.btn} ${styles.secondary}`}
          >
            <Save
              className={styles.btnIcon}
              size={17}
            />

            {loading
              ? "Saving..."
              : "Save Preferences"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

const Setting = ({
  student_id,
  username,
  email: initialEmail,
  setEmail,
  token,
}) => {
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    student_id: student_id || "",
    currentEmail: initialEmail || "",
  });

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("password");

  const strength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  /* ------------------------------------------------------------------------ */
  /* Sync parent data                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    setForm((previous) => ({
      ...previous,
      student_id: student_id || "",
      currentEmail: initialEmail || "",
    }));
  }, [student_id, initialEmail]);

  /* ------------------------------------------------------------------------ */
  /* Notification                                                             */
  /* ------------------------------------------------------------------------ */

  const notify = (type, text, timeout = 4000) => {
    setNotification({
      type,
      text,
    });

    window.setTimeout(() => {
      setNotification(null);
    }, timeout);
  };

  /* ------------------------------------------------------------------------ */
  /* Input Handler                                                            */
  /* ------------------------------------------------------------------------ */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* Password                                                                  */
  /* ------------------------------------------------------------------------ */

  const handlePasswordSubmit = async (event) => {
    event?.preventDefault();

    if (!form.student_id) {
      notify("error", "Student ID is missing.");
      return;
    }

    if (!token) {
      notify("error", "Authentication session is missing.");
      return;
    }

    if (!form.password) {
      notify("error", "Please enter your new password.");
      return;
    }

    if (form.password.length < 8) {
      notify(
        "error",
        "Password must be at least 8 characters."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      notify("error", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await changePassword(
        {
          student_id: form.student_id,
          password: form.password,
        },
        token
      );

      notify(
        "success",
        "Password updated successfully."
      );

      setForm((previous) => ({
        ...previous,
        password: "",
        confirmPassword: "",
      }));

      setShowPassword(false);
      setShowConfirm(false);
    } catch (error) {
      console.error(
        "Password update failed:",
        error?.message || error
      );

      notify(
        "error",
        error?.message ||
          "Failed to update password."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Email                                                                     */
  /* ------------------------------------------------------------------------ */

  const handleEmailSubmit = async (event) => {
    event?.preventDefault();

    const newEmail = form.newEmail.trim();

    if (!form.student_id) {
      notify("error", "Student ID is missing.");
      return;
    }

    if (!token) {
      notify("error", "Authentication session is missing.");
      return;
    }

    if (!newEmail) {
      notify(
        "error",
        "Please enter your new email address."
      );
      return;
    }

    if (!isValidEmail(newEmail)) {
      notify(
        "error",
        "Please enter a valid email address."
      );
      return;
    }

    if (
      newEmail.toLowerCase() ===
      form.currentEmail.trim().toLowerCase()
    ) {
      notify(
        "error",
        "New email must be different."
      );
      return;
    }

    setLoading(true);

    try {
      await changeEmail(
        {
          student_id: form.student_id,
          new_email: newEmail,
        },
        token
      );

      setForm((previous) => ({
        ...previous,
        currentEmail: newEmail,
        newEmail: "",
      }));

      if (typeof setEmail === "function") {
        setEmail(newEmail);
      }

      try {
        localStorage.setItem(
          "email",
          newEmail
        );
      } catch {
        // Ignore localStorage errors.
      }

      notify(
        "success",
        "Email updated. Please verify your new email."
      );
    } catch (error) {
      console.error(
        "Email update failed:",
        error?.message || error
      );

      notify(
        "error",
        error?.message ||
          "Failed to update email."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Notifications                                                             */
  /* ------------------------------------------------------------------------ */

  const handleNotificationSubmit = async (event) => {
    event?.preventDefault();

    setLoading(true);

    try {
      /*
       * Currently notification preferences are saved locally/simulated.
       * Replace this section with an API request when the backend endpoint
       * is available.
       */

      await new Promise((resolve) =>
        window.setTimeout(resolve, 700)
      );

      notify(
        "success",
        "Notification preferences saved."
      );
    } catch (error) {
      console.error(
        "Notification preferences update failed:",
        error?.message || error
      );

      notify(
        "error",
        "Failed to save preferences."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  const displayStudentId =
    form.student_id || username || "—";

  return (
    <div className={styles.container}>
      <Toast notification={notification} />

      <SettingsHeader />

      <main className={styles.card}>
        <AccountInformation
          studentId={displayStudentId}
          email={form.currentEmail}
        />

        <SettingsTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "email" && (
          <EmailSettings
            form={form}
            loading={loading}
            onChange={handleChange}
            onSubmit={handleEmailSubmit}
          />
        )}

        {activeTab === "password" && (
          <PasswordSettings
            form={form}
            loading={loading}
            strength={strength}
            showPassword={showPassword}
            showConfirm={showConfirm}
            onChange={handleChange}
            onTogglePassword={() =>
              setShowPassword(
                (previous) => !previous
              )
            }
            onToggleConfirm={() =>
              setShowConfirm(
                (previous) => !previous
              )
            }
            onSubmit={handlePasswordSubmit}
          />
        )}

        {activeTab === "notifications" && (
          <NotificationSettings
            enabled={form.notifications}
            loading={loading}
            onChange={handleChange}
            onSubmit={handleNotificationSubmit}
          />
        )}
      </main>
    </div>
  );
};

export default Setting;