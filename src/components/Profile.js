import React, { useCallback } from "react";
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
} from "lucide-react";

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
 *
 * Profile data and photo are loaded by ProtectedApp.
 */
const Profile = ({
  studentId,
  student,
  photo,
  photoError = false,
}) => {
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

  /**
   * Student photo.
   *
   * The API may return a Blob URL.
   * If it fails, use the default avatar.
   */
  const photoSource =
    photoError || !photo
      ? "/default-avatar.jpg"
      : photo;

  /**
   * Student name.
   */
  const studentName =
    `${student.per_title || ""} ${
      student.per_name || ""
    }`.trim() || "Student";

  /**
   * Academic term.
   */
  const academicTerm = getTerm(
    student.stu_academicTerm
  );

  /**
   * Academic year.
   */
  const academicYear = displayValue(
    student.stu_academicYear,
    ""
  );

  const academicSession =
    academicTerm && academicYear
      ? `${academicTerm} ${academicYear}`
      : academicTerm ||
        academicYear ||
        "Not specified";

  /**
   * Programme name.
   */
  const programmeName =
    student.pro_officialName ||
    student.pro_name ||
    "Programme not specified";

  /**
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