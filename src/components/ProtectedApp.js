
import React, { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  BarChart3,
  FileText,
  Settings,
} from "lucide-react";

import Sidebar from "./Sidebar";
import Header from "./Header";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import Results from "./Results";
import Courses from "./Courses";
import Placeholder from "./Placeholder";
import AcademicPerformance from "./AcademicPerformance";
import SubjectRegistration from "./SubjectRegistration";
import Setting from "./Settings";

import { stats } from "../studentData";
import { useAuth } from "../context/AuthContext";
import TokenService from "../services/tokenService";
import { fetchCurrentTerm } from "../services/optionsService";

import {
  fetchStudentRecord,
  fetchStudentPhoto,
} from "../services/studentService";

const PANEL_COPY = {
  courses: {
    icon: BookOpen,
    title: "Courses",
    message:
      "Your enrolled courses for this semester will appear here once registration opens.",
  },
  performance: {
    icon: BarChart3,
    title: "Academic Performance",
    message:
      "Grade trends and CGPA history will be shown here after your first results are published.",
  },
  results: {
    icon: FileText,
    title: "Results",
    message:
      "Semester results will be listed here as soon as they are released by the registrar.",
  },
  results: {
    icon: FileText,
    title: "Applications",
    message:
      "Application for course registration to the Office of the Controller of Examinations.",
  },
  settings: {
    icon: Settings,
    title: "Settings",
    message:
      "Account, notification and password preferences will live here.",
  },
};

export default function ProtectedApp() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [student, setStudent] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState(false);

  const [current_term, setCurrentTerm] = useState(null);
  const [current_year, setCurrentYear] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = TokenService.getAccessToken();

  // IMPORTANT: user is a profile object; studentId is a string.
  const studentId =
    typeof user === "string"
      ? user
      : String(
          user?.student_id ??
          user?.studentID ??
          user?.studentId ??
          ""
        ).trim();

  const rawStudentName =
    student?.per_name ??
    student?.name ??
    student?.fullName ??
    student?.full_name ??
    user?.per_name ??
    user?.name ??
    user?.fullName ??
    user?.full_name ??
    user?.studentName ??
    user?.username ??
    "";

  // Never pass an object to Header as its display name.
  const studentName =
    typeof rawStudentName === "string" ||
    typeof rawStudentName === "number"
      ? String(rawStudentName)
      : "";

  /**
   * Close the mobile sidebar when returning to desktop size.
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /**
   * Load the current academic term and year.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadCurrentTerm() {
      if (!studentId || !token) {
        setCurrentTerm(null);
        setCurrentYear(null);
        return;
      }

      try {
        const current = await fetchCurrentTerm();

        if (cancelled) return;

        setCurrentTerm(current?.term ?? null);
        setCurrentYear(current?.year ?? null);
      } catch (err) {
        if (cancelled) return;

        setCurrentTerm(null);
        setCurrentYear(null);

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[ProtectedApp] Failed to load current academic term.",
            err
          );
        }
      }
    }

    loadCurrentTerm();

    return () => {
      cancelled = true;
    };
  }, [studentId, token]);

  /**
   * Handle sidebar navigation and logout.
   */
  const handleNavigate = async (key) => {
    if (key !== "logout") {
      setActiveTab(key);
      setSidebarOpen(false);
      return;
    }

    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  /**
   * Load the student profile and photo using the student ID.
   */
  const loadProfile = useCallback(async () => {
    if (!studentId || !token) {
      setStudent(null);
      setPhoto(null);
      setPhotoError(false);
      setError(
        !studentId
          ? "Student ID could not be found in your account information."
          : "Your authentication token is missing. Please sign in again."
      );
      setLoading(false);
      return;
    }

    let cancelled = false;

    setLoading(true);
    setError("");
    setPhoto(null);
    setPhotoError(false);

    try {
      // Pass the ID, not the entire user object.
      const record = await fetchStudentRecord(studentId, token);

      if (cancelled) return;

      if (!record || typeof record !== "object") {
        throw new Error("Student profile information was not found.");
      }

      setStudent(record);

      // Photo loading is independent of profile loading.
      try {
        const photoBlobUrl = await fetchStudentPhoto(studentId, token);

        if (cancelled) return;

        if (photoBlobUrl) {
          setPhoto(photoBlobUrl);
          setPhotoError(false);
        } else {
          setPhoto(null);
          setPhotoError(true);
        }
      } catch (photoErr) {
        if (cancelled) return;

        setPhoto(null);
        setPhotoError(true);

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[ProtectedApp] Student photo could not be loaded.",
            photoErr
          );
        }
      }
    } catch (err) {
      if (cancelled) return;

      const status = err?.response?.status;
      const responseMessage =
        err?.response?.data?.detail ??
        err?.response?.data?.message;

      if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setError("You do not have permission to view this profile.");
      } else if (status === 404) {
        setError("Student profile information was not found.");
      } else if (status >= 500) {
        setError(
          "The server is currently unavailable. Please try again later."
        );
      } else if (
        err?.message?.toLowerCase().includes("network") ||
        !err?.response
      ) {
        setError(
          "Unable to connect to the server. Please check your internet connection and try again."
        );
      } else {
        setError(
          typeof responseMessage === "string"
            ? responseMessage
            : err?.message || "Unable to load student profile."
        );
      }

      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[ProtectedApp] Failed to load student profile.",
          status ? `HTTP ${status}` : "Request failed",
          err
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [studentId, token]);

  useEffect(() => {
    let cancelled = false;

    async function runProfileLoad() {
      if (!studentId || !token) {
        setStudent(null);
        setPhoto(null);
        setPhotoError(false);
        setError(
          !studentId
            ? "Student ID could not be found in your account information."
            : "Your authentication token is missing. Please sign in again."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setPhoto(null);
      setPhotoError(false);

      try {
        const record = await fetchStudentRecord(studentId, token);

        if (cancelled) return;

        if (!record || typeof record !== "object") {
          throw new Error("Student profile information was not found.");
        }

        setStudent(record);

        try {
          const photoBlobUrl = await fetchStudentPhoto(studentId, token);

          if (cancelled) return;

          setPhoto(photoBlobUrl || null);
          setPhotoError(!photoBlobUrl);
        } catch (photoErr) {
          if (cancelled) return;

          setPhoto(null);
          setPhotoError(true);

          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[ProtectedApp] Student photo could not be loaded.",
              photoErr
            );
          }
        }
      } catch (err) {
        if (cancelled) return;

        const status = err?.response?.status;
        const responseMessage =
          err?.response?.data?.detail ??
          err?.response?.data?.message;

        if (status === 401) {
          setError("Your session has expired. Please log in again.");
        } else if (status === 403) {
          setError("You do not have permission to view this profile.");
        } else if (status === 404) {
          setError("Student profile information was not found.");
        } else if (status >= 500) {
          setError(
            "The server is currently unavailable. Please try again later."
          );
        } else if (
          err?.message?.toLowerCase().includes("network") ||
          !err?.response
        ) {
          setError(
            "Unable to connect to the server. Please check your internet connection and try again."
          );
        } else {
          setError(
            typeof responseMessage === "string"
              ? responseMessage
              : err?.message || "Unable to load student profile."
          );
        }

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[ProtectedApp] Failed to load student profile.",
            status ? `HTTP ${status}` : "Request failed",
            err
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    runProfileLoad();

    return () => {
      cancelled = true;
    };
  }, [studentId, token]);

  /**
   * Render the selected panel.
   */
  const renderPanel = () => {
    if (activeTab === "dashboard") {
      return (
        <Dashboard
          stats={stats}
          student={student || user}
        />
      );
    }

    if (activeTab === "profile") {
      return (
        <Profile
          studentId={studentId}
          student={student || user}
          photo={photo}
          photoError={photoError}
        />
      );
    }

    if (activeTab === "results") {
      return (
        <Results
          student_id={studentId}
          token={token}
          term={current_term}
          year={current_year}
        />
      );
    }

    if (activeTab === "courses") {
      return (
        <Courses
          student_id={studentId}
          token={token}
        />
      );
    }

    if (activeTab === "performance") {
      return (
        <AcademicPerformance
          student_id={studentId}
          token={token}
        />
      );
    }
     if (activeTab === "subject-registration") {
      return (
        <SubjectRegistration
          user= {student || user}
          student_id={studentId}
          token={token}
          term={current_term}
          year={current_year}
        />
        
      );
    }

    if (activeTab === "settings") {
      return (
        <Setting
          student_id={studentId}
          token={token}
        />
      );
    }

    const copy = PANEL_COPY[activeTab];

    return copy ? <Placeholder {...copy} /> : null;
  };

  // Let the parent authentication guard handle a missing user.
  if (!user) {
    return null;
  }

  // Show a readable error if authentication returned no student ID.
  if (!studentId) {
    return (
      <div className="app-shell">
        <div className="app-main">
          <main className="app-content">
            <div className="profile-error">
              Student ID could not be found in your account information.
              Please sign in again or contact the administrator.
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <Header
          studentId={studentId}
          studentName={studentName}
          onOpenMenu={() => setSidebarOpen(true)}
          onLogout={() => handleNavigate("logout")}
        />

        <main className="app-content">
          {loading && !student ? (
            <div className="profile-loading">
              <div className="profile-spinner" />
              <h3>Loading Student Information</h3>
              <p>
                Please wait while we load your student information...
              </p>
            </div>
          ) : error && !student ? (
            <div className="profile-error">{error}</div>
          ) : (
            renderPanel()
          )}
        </main>

        <footer className="app-footer">
          &copy; {new Date().getFullYear()} Metropolitan University.
          All rights reserved.
        </footer>
      </div>

      {loggingOut && (
        <div className="logout-overlay">
          <div className="logout-dialog">Signing out…</div>
        </div>
      )}
    </div>
  );
}
