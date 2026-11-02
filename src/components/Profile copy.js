import React, { useCallback, useEffect, useState } from "react";
import {
  UserCircle2,
  GraduationCap,
  FileText,
  Users,
  CalendarDays,
  BookOpen,
  Building2,
  MapPin,
  Phone,
  Cake,
  VenetianMask,
  Droplet,
  Globe2,
  Home,
  UserRound,
  Heart,
  RefreshCw,
} from "lucide-react";

import {
  fetchStudentRecord,
  fetchStudentPhoto,
} from "../services/student";

import styles from "../styles/Profile.module.css";

/**
 * Safely return a displayable value.
 */
const displayValue = (value, fallback = "Not specified") => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value).trim();
};

/**
 * Reusable information item.
 */
const InfoItem = ({
  icon: Icon,
  label,
  value,
  fullWidth = false,
}) => {
  return (
    <div
      className={`${styles.infoItem} ${
        fullWidth ? styles.infoItemFull : ""
      }`}
    >
      <div className={styles.infoIcon}>
        <Icon size={18} strokeWidth={1.8} />
      </div>

      <div className={styles.infoContent}>
        <span className={styles.infoLabel}>{label}</span>

        <span className={styles.infoValue}>
          {displayValue(value)}
        </span>
      </div>
    </div>
  );
};

/**
 * Reusable profile section.
 */
const ProfileSection = ({
  icon: Icon,
  title,
  children,
  className = "",
}) => {
  return (
    <section
      className={`${styles.profileSection} ${className}`}
    >
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>
          <Icon size={19} strokeWidth={1.8} />
        </div>

        <h2>{title}</h2>
      </div>

      <div className={styles.sectionContent}>
        {children}
      </div>
    </section>
  );
};

/**
 * Student Profile Component.
 */
const Profile = ({ student_id, token }) => {
  const [student, setStudent] = useState(null);
  const [photo, setPhoto] = useState(null);

  const [photoError, setPhotoError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Convert academic term number to label.
   */
  const getTerm = useCallback((term) => {
    switch (Number(term)) {
      case 1:
        return "Spring";

      case 2:
        return "Summer";

      case 3:
        return "Autumn";

      default:
        return "";
    }
  }, []);

  /**
   * Get student ID from possible API field names.
   *
   * Different API responses sometimes use:
   * student_id
   * studentID
   * studentId
   */
  const getStudentId = useCallback((record) => {
    return (
      record?.student_id ??
      record?.studentID ??
      record?.studentId ??
      ""
    );
  }, []);

  /**
   * Load student profile and photo.
   */
  const loadProfile = useCallback(async () => {
    
    if (!student_id || !token) {
      setStudent(null);
      setPhoto(null);
      setError(
        "Student information or authentication token is missing."
      );      
      setLoading(false);
      return;
    }
     
    console.log("Tests")
    setLoading(true);
    setError("");
    setPhoto(null);
    setPhotoError(false);

    try {
      /*
       * Load student information.
       */
      const record = await fetchStudentRecord(
        student_id,
        token
      );

      if (!record) {
        throw new Error(
          "Student profile information was not found."
        );
      }
   
      setStudent(record);

      /*
       * Load student photo separately.
       *
       * Photo failure should NOT prevent the profile
       * information from being displayed.
       */
      try {
        const photoBlobUrl = await fetchStudentPhoto(
          student_id,
          token
        );

        if (photoBlobUrl) {
          setPhoto(photoBlobUrl);
          setPhotoError(false);
        } else {
          setPhoto(null);
          setPhotoError(true);
        }
      } catch (photoErr) {
        setPhoto(null);
        setPhotoError(true);

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[Profile] Student photo could not be loaded."
          );
        }
      }
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        setError(
          "Your session has expired. Please log in again."
        );
      } else if (status === 403) {
        setError(
          "You do not have permission to view this profile."
        );
      } else if (status === 404) {
        setError(
          "Student profile information was not found."
        );
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
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load student profile."
        );
      }

      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Profile] Failed to load student profile.",
          status ? `HTTP ${status}` : "Request failed"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [student_id, token]);

  /**
   * Load profile when student ID or token changes.
   */
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /**
   * Loading state.
   */
  if (loading) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.profileLoading}>
          <div className={styles.profileSpinner} />

          <h3>Loading Profile</h3>

          <p>
            Please wait while we load your student
            information...
          </p>
        </div>
      </div>
    );
  }

  /**
   * Error state.
   */
  if (error) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.profileError}>
          <div className={styles.profileErrorIcon}>
            <UserCircle2 size={40} />
          </div>

          <h3>Unable to Load Profile</h3>

          <p>{error}</p>

          <button
            type="button"
            className={styles.retryButton}
            onClick={loadProfile}
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  /**
   * Empty state.
   */
  if (!student) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.profileEmpty}>
          <UserCircle2 size={48} />

          <h3>No Student Data</h3>

          <p>
            No student profile information is available.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Student ID.
   */
  const studentId = getStudentId(student);

  /*
   * Student photo.
   *
   * The API may return a Blob URL.
   * If it fails, use the default avatar.
   */
  const photoSource =
    photoError || !photo
      ? "/default-avatar.jpg"
      : photo;

  /*
   * Student name.
   */
  const studentName =
    `${student.per_title || ""} ${
      student.per_name || ""
    }`.trim() || "Student";

  /*
   * Academic term.
   */
  const academicTerm = getTerm(
    student.stu_academicTerm
  );

  /*
   * Academic year.
   */
  const academicYear = displayValue(
    student.stu_academicYear,
    ""
  );

  const academicSession =
    academicTerm && academicYear
      ? `${academicTerm} ${academicYear}`
      : academicTerm || academicYear || "Not specified";

  /*
   * Programme name.
   */
  const programmeName =
    student.pro_officialName ||
    student.pro_name ||
    "Programme not specified";

  /*
   * Department name.
   */
  const departmentName =
    student.dpt_officalNameforCertificate ||
    student.dpt_officialName ||
    student.departmentName ||
    "Department not specified";

  return (
    <div className={styles.profileContainer}>
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>
            <GraduationCap size={28} />

            <h1>Student Profile</h1>
          </div>

          <p>
            View your personal and academic information.
          </p>
        </div>
      </div>

      {/* =====================================================
          PROFILE HERO
      ====================================================== */}
      <div className={styles.profileHero}>
        <div className={styles.profileHeroContent}>
          {/* PHOTO */}
          <div className={styles.avatarWrapper}>
            <img
              className={styles.profileAvatar}
              src={photoSource}
              alt={`${studentName}'s profile`}
              onError={(event) => {
                if (
                  event.currentTarget.src.includes(
                    "default-avatar.jpg"
                  )
                ) {
                  return;
                }

                setPhotoError(true);
                event.currentTarget.src =
                  "/default-avatar.jpg";
              }}
            />
          </div>

          {/* BASIC INFORMATION */}
          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <h2>{studentName}</h2>

              <span className={styles.status}>
                Active Student
              </span>
            </div>

            <p className={styles.profileProgram}>
              {programmeName}

              {student.pro_shortName && (
                <span>
                  {" "}
                  ({student.pro_shortName})
                </span>
              )}
            </p>

            <div className={styles.quickInfo}>
              <div className={styles.quickInfoItem}>
                <FileText size={16} />

                <span>
                  {displayValue(
                    studentId,
                    "ID not specified"
                  )}
                </span>
              </div>

              <div className={styles.quickInfoItem}>
                <Building2 size={16} />

                <span>{departmentName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ACADEMIC INFORMATION
      ====================================================== */}
      <ProfileSection
        icon={GraduationCap}
        title="Academic Information"
      >
        <div className={styles.infoGrid}>
          <InfoItem
            icon={FileText}
            label="Student ID"
            value={studentId}
          />

          <InfoItem
            icon={BookOpen}
            label="Programme"
            value={programmeName}
          />

          <InfoItem
            icon={Building2}
            label="Department"
            value={departmentName}
          />

          <InfoItem
            icon={Users}
            label="Batch"
            value={student.batchName}
          />

          <InfoItem
            icon={UserRound}
            label="Section"
            value={student.sectionName}
          />

          <InfoItem
            icon={CalendarDays}
            label="Academic Session"
            value={academicSession}
          />

          <InfoItem
            icon={CalendarDays}
            label="Admission Date"
            value={student.adm_date}
          />
        </div>
      </ProfileSection>

      {/* =====================================================
          PERSONAL INFORMATION
      ====================================================== */}
      <ProfileSection
        icon={UserCircle2}
        title="Personal Information"
      >
        <div className={styles.infoGrid}>
          <InfoItem
            icon={Cake}
            label="Date of Birth"
            value={student.per_dateOfBirth}
          />

          <InfoItem
            icon={VenetianMask}
            label="Gender"
            value={student.per_gender}
          />

          <InfoItem
            icon={Droplet}
            label="Blood Group"
            value={student.per_bloodGroup}
          />

          <InfoItem
            icon={Globe2}
            label="Nationality"
            value={student.per_nationality}
          />

          <InfoItem
            icon={Phone}
            label="Mobile"
            value={student.per_mobile}
          />

          <InfoItem
            icon={Phone}
            label="Guardian Mobile"
            value={student.stu_guardiansMobile}
          />
        </div>
      </ProfileSection>

      {/* =====================================================
          FAMILY INFORMATION
      ====================================================== */}
      <ProfileSection
        icon={Heart}
        title="Family Information"
      >
        <div className={styles.infoGrid}>
          <InfoItem
            icon={UserRound}
            label="Father's Name"
            value={student.per_fathersName}
          />

          <InfoItem
            icon={UserRound}
            label="Mother's Name"
            value={student.per_mothersName}
          />
        </div>
      </ProfileSection>

      {/* =====================================================
          ADDRESS INFORMATION
      ====================================================== */}
      <ProfileSection
        icon={MapPin}
        title="Address Information"
      >
        <div
          className={`${styles.infoGrid} ${styles.addressGrid}`}
        >
          <InfoItem
            icon={Home}
            label="Present Address"
            value={student.per_presentAddress}
            fullWidth
          />

          <InfoItem
            icon={MapPin}
            label="Permanent Address"
            value={student.per_permanentAddress}
            fullWidth
          />
        </div>
      </ProfileSection>
    </div>
  );
};

export default Profile;

