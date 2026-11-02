
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import logo from "../assets/MU.jpg";
import { DEMO_MODE } from "../config";
import "../styles/Login.css";

const EMPTY_OTP = ["", "", "", "", "", ""];

function getErrorText(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  if (value instanceof Error) {
    return value.message || "Something went wrong.";
  }

  if (value && typeof value === "object") {
    if (typeof value.message === "string") return value.message;
    if (typeof value.detail === "string") return value.detail;
    if (typeof value.error === "string") return value.error;

    if (Array.isArray(value.detail)) {
      return value.detail
        .map((item) =>
          typeof item === "string" ? item : item?.msg || ""
        )
        .filter(Boolean)
        .join(", ");
    }
  }

  return "Unable to complete your request. Please try again.";
}

function normalizeResponse(response) {
  let result = response;

  for (let i = 0; i < 2; i += 1) {
    if (
      result &&
      typeof result === "object" &&
      result.data &&
      typeof result.data === "object"
    ) {
      result = result.data;
    } else {
      break;
    }
  }

  return result;
}

export default function Login() {
  const { login, verifyOtp, completeLogin } = useAuth();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState("login");
  const [otpStudentId, setOtpStudentId] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpDigits, setOtpDigits] = useState([...EMPTY_OTP]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef([]);

  const otp = otpDigits.join("");
  const isOtpComplete = /^\d{6}$/.test(otp);

  useEffect(() => {
    if (step !== "otp") return undefined;

    const timer = setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [step]);

  // STEP 1: Validate credentials and request email OTP.
  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const studentId = loginId.trim();

    if (!studentId || !password) {
      setError("Please enter your Student ID and password.");
      return;
    }

    if (typeof login !== "function") {
      setError("Login is not configured in AuthContext.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await login(studentId, password, remember);
      const result = normalizeResponse(response);

      if (!result || typeof result !== "object" || Array.isArray(result)) {
        setError("The server returned an invalid response.");
        return;
      }

      if (result.success === false) {
        setError(getErrorText(result));
        return;
      }

      const requiresOtp =
        result.requiresOtp === true ||
        result.requires_otp === true ||
        result.otp_required === true;

      if (requiresOtp) {
        setOtpStudentId(
          String(result.studentId || result.student_id || studentId)
        );

        setOtpEmail(
          typeof result.email === "string" ? result.email : ""
        );

        setOtpMessage(
          typeof result.message === "string"
            ? result.message
            : "A verification code has been sent to your registered email."
        );

        setOtpDigits([...EMPTY_OTP]);
        setError("");
        setStep("otp");
        return;
      }

      // Preserve compatibility with an authentication flow that
      // completes login directly without OTP.
      if (result.requiresOtp === false || result.requires_otp === false) {
        setError(
          "The server did not request OTP verification. Please check your authentication configuration."
        );
        return;
      }

      setError(
        "The server response did not confirm OTP verification. Please try again."
      );
    } catch (err) {
      setError(
        getErrorText(
          err?.response?.data || err?.message || err
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle entering or pasting OTP digits.
  const handleOtpChange = (index, value) => {
    const digits = String(value).replace(/\D/g, "");

    if (!digits) {
      setOtpDigits((previous) =>
        previous.map((digit, i) => (i === index ? "" : digit))
      );
      return;
    }

    const incoming = digits.slice(0, 6 - index).split("");

    setOtpDigits((previous) => {
      const next = [...previous];

      incoming.forEach((digit, offset) => {
        next[index + offset] = digit;
      });

      return next;
    });

    const nextIndex = Math.min(index + incoming.length, 5);
    otpRefs.current[nextIndex]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (otpDigits[index]) {
        setOtpDigits((previous) =>
          previous.map((digit, i) => (i === index ? "" : digit))
        );
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pasted) return;

    setOtpDigits(
      Array.from({ length: 6 }, (_, index) => pasted[index] || "")
    );

    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // STEP 2: Verify OTP and complete authentication.
  const submitOtp = async (event) => {
    event.preventDefault();
    setError("");

    if (!isOtpComplete) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    if (typeof verifyOtp !== "function") {
      setError("OTP verification is not configured in AuthContext.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await verifyOtp(
        otpStudentId,
        otp,
        remember
      );

      const result = normalizeResponse(response);

      if (!result || typeof result !== "object" || Array.isArray(result)) {
        throw new Error("The server returned an invalid response.");
      }

      if (
        result.success === false ||
        result.verified === false
      ) {
        throw new Error(getErrorText(result));
      }

      // Accept either a profile object or a response envelope.
      const student =
        result.user && typeof result.user === "object"
          ? result.user
          : result.student && typeof result.student === "object"
            ? result.student
            : result;

      const studentId =
        student.student_id ||
        student.studentID ||
        student.studentId;

      if (!studentId) {
        throw new Error(
          "OTP verification response is missing the student ID."
        );
      }

      if (typeof completeLogin !== "function") {
        throw new Error(
          "OTP verification succeeded, but completeLogin is not configured in AuthContext."
        );
      }

      await completeLogin(student);
    } catch (err) {
      setError(
        getErrorText(
          err?.response?.data || err?.message || err
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const returnToLogin = () => {
    if (submitting) return;

    setStep("login");
    setOtpDigits([...EMPTY_OTP]);
    setOtpStudentId("");
    setOtpEmail("");
    setOtpMessage("");
    setError("");
  };

  return (
    <main className="mu-login-page">
      <div className="mu-login-background mu-login-background-one" />
      <div className="mu-login-background mu-login-background-two" />

      <section className="mu-login-layout">
        {/* LEFT: CAMPUS BRANDING */}
        <div className="mu-login-brand-panel">
          <div className="mu-brand-top">
            <div className="mu-brand-logo">
              <img
                src={logo}
                alt="Metropolitan University logo"
              />
            </div>

            <div className="mu-brand-name">
              <span>METROPOLITAN UNIVERSITY</span>
              <small>Campus Student Portal</small>
            </div>
          </div>

          <div className="mu-brand-content">
            <div className="mu-brand-symbol">
              <GraduationCap size={36} strokeWidth={1.6} />
            </div>

            <p className="mu-brand-eyebrow">
              YOUR ACADEMIC JOURNEY
            </p>

            <h1>
              Welcome to
              <br />
              Campus.
            </h1>

            <p className="mu-brand-description">
              Your university experience, all in one place. Access
              your academic records, examination results, registered
              courses, and essential student services through the
              secure Campus Student Portal.
            </p>

            <div className="mu-brand-features">
              <div>
                <CheckCircle2 size={18} />
                <span>Your academic information in one place</span>
              </div>

              <div>
                <CheckCircle2 size={18} />
                <span>Secure and convenient student access</span>
              </div>
            </div>
          </div>

          <div className="mu-brand-footer">
            Metropolitan University · Campus Student Portal
          </div>
        </div>

        {/* RIGHT: LOGIN AND OTP */}
        <div className="mu-login-main">
          <div className="mu-login-card">
            {/* MOBILE BRANDING */}
            <div className="mu-mobile-brand">
              <img
                src={logo}
                alt="Metropolitan University logo"
              />

              <div>
                <strong>Campus</strong>
                <span>Student Portal · Metropolitan University</span>
              </div>
            </div>

            <div className="mu-login-card-heading">
              <div className="mu-step-indicator">
                <span className={step === "login" ? "active" : "complete"}>
                  {step === "otp" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    "1"
                  )}
                </span>

                <div className={step === "otp" ? "active" : ""} />

                <span className={step === "otp" ? "active" : ""}>
                  2
                </span>
              </div>

              {step === "login" ? (
                <>
                  <p className="mu-section-eyebrow">
                    CAMPUS STUDENT PORTAL
                  </p>

                  <h2>Sign in to Campus</h2>

                  <p className="mu-card-description">
                    Enter your Student ID and password to access your
                    academic information, courses, results, and
                    student services.
                  </p>
                </>
              ) : (
                <>
                  <div className="mu-otp-icon">
                    <ShieldCheck size={29} strokeWidth={1.8} />
                  </div>

                  <p className="mu-section-eyebrow">
                    CAMPUS ACCOUNT SECURITY
                  </p>

                  <h2>Verify your identity</h2>

                  <p className="mu-card-description">
                    Enter the verification code sent to your registered
                    email to securely access Campus.
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="mu-auth-error" role="alert">
                <span className="mu-error-mark">!</span>
                <span>{error}</span>
              </div>
            )}

            {step === "login" ? (
              <form
                className="mu-auth-form"
                onSubmit={submit}
                noValidate
              >
                <div className="mu-field">
                  <label htmlFor="loginId">
                    Student ID / Login ID
                  </label>

                  <div className="mu-input-box">
                    <UserRound size={18} aria-hidden="true" />

                    <input
                      id="loginId"
                      name="username"
                      type="text"
                      value={loginId}
                      onChange={(event) =>
                        setLoginId(event.target.value)
                      }
                      autoComplete="username"
                      placeholder="Enter your Student ID"
                      disabled={submitting}
                      required
                    />
                  </div>
                </div>

                <div className="mu-field">
                  <label htmlFor="password">Password</label>

                  <div className="mu-input-box">
                    <LockKeyhole size={18} aria-hidden="true" />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      disabled={submitting}
                      required
                    />

                    <button
                      type="button"
                      className="mu-password-toggle"
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      disabled={submitting}
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mu-form-options">
                  <label className="mu-remember-option">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) =>
                        setRemember(event.target.checked)
                      }
                      disabled={submitting}
                    />

                    <span>Remember me</span>
                  </label>
                </div>

                <button
                  className="mu-primary-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="mu-spinner" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to Campus
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {DEMO_MODE && (
                  <div className="mu-demo-note">
                    <strong>Demo mode enabled.</strong>

                    <span>
                      Authentication is currently configured for
                      demonstration.
                    </span>
                  </div>
                )}
              </form>
            ) : (
              <form
                className="mu-auth-form mu-otp-form"
                onSubmit={submitOtp}
                noValidate
              >
                <div className="mu-delivery-note">
                  <div className="mu-delivery-icon">
                    <Mail size={20} />
                  </div>

                  <div className="mu-delivery-text">
                    <strong>Check your registered email</strong>

                    <p>{otpMessage}</p>

                    {otpEmail && (
                      <span className="mu-email-address">
                        {otpEmail}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mu-otp-account">
                  <span>Student ID</span>
                  <strong>{otpStudentId}</strong>
                </div>

                <div className="mu-field">
                  <label id="otp-label">
                    6-digit verification code
                  </label>

                  <div
                    className="mu-otp-inputs"
                    role="group"
                    aria-labelledby="otp-label"
                  >
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          otpRefs.current[index] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={
                          index === 0 ? "one-time-code" : "off"
                        }
                        aria-label={`OTP digit ${index + 1}`}
                        value={digit}
                        maxLength={6}
                        onChange={(event) =>
                          handleOtpChange(index, event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleOtpKeyDown(index, event)
                        }
                        onPaste={handleOtpPaste}
                        disabled={submitting}
                        required
                      />
                    ))}
                  </div>

                  <p className="mu-otp-helper">
                    Enter the code from your email. You can also paste
                    all six digits.
                  </p>
                </div>

                <button
                  className="mu-primary-button"
                  type="submit"
                  disabled={submitting || !isOtpComplete}
                >
                  {submitting ? (
                    <>
                      <span className="mu-spinner" />
                      Verifying code...
                    </>
                  ) : (
                    <>
                      Verify and access Campus
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="mu-back-button"
                  onClick={returnToLogin}
                  disabled={submitting}
                >
                  <ArrowLeft size={17} />
                  Back to sign in
                </button>
              </form>
            )}

            <div className="mu-login-card-footer">
              <LockKeyhole size={14} />

              <span>
                Your Campus account is protected by secure authentication.
              </span>
            </div>
          </div>

          <p className="mu-page-copyright">
            © {new Date().getFullYear()} Metropolitan University ·
            Campus Student Portal. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}
