import React, { useEffect, useState } from "react";
import { fetchStudentRecord, fetchStudentPhoto } from "../api/student";
import "./Profile.css";

const Profile = ({ student_id, token }) => {
  const [student, setStudent] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const record = await fetchStudentRecord(student_id, token);
        const photoBlobUrl = await fetchStudentPhoto(student_id, token);

        setStudent(record);
        setPhoto(photoBlobUrl);  // ✅ Correct
      } catch (err) {
        console.error("❌ Failed to load student profile:", err);
        setError("Unable to load student profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (student_id && token) {
      loadData();
    }
  }, [student_id, token]);

  const getTerm = (term) => {
    switch (term) {
      case 1: return "Spring";
      case 2: return "Summer";
      case 3: return "Autumn";
      default: return "Not specified";
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!student) return <div className="profile-empty">No student data found.</div>;

  // Choose correct photo source
  const photoUrl = photoError ? "/default-avatar.jpg" : photo;

  return (
    <div className="profile-container">
      <h1 className="profile-title">🎓 Student Profile</h1>

      <div className="profile-card">
        <div className="profile-header">
          
          {/* Photo Section */}
          <div className="profile-photo">
            <img
              className="profile-photo"
              src={photoUrl}
              alt={`${student.per_name}'s Photo`}
              onError={() => {
                console.warn("⚠️ Photo not found. Using default.");
                setPhotoError(true);
              }}
            />
          </div>

          {/* Student Information */}
          <div className="profile-info">
            <h2 className="profile-name">
              {student.per_title} {student.per_name}
            </h2>
            <p className="profile-subtitle">
              {student.pro_officialName} <span>({student.pro_shortName})</span>
            </p>

            <div className="profile-grid">
              <div><strong>Student ID:</strong> {student.student_id}</div>
              <div><strong>Batch:</strong> {student.batchName}</div>
              <div><strong>Section:</strong> {student.sectionName}</div>
              <div>
                <strong>Academic Year:</strong>{" "}
                {getTerm(student.stu_academicTerm)} {student.stu_academicYear}
              </div>
              <div><strong>Admission Date:</strong> {student.adm_date}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="profile-details">
        
        <h3>Personal Information</h3>
        <div className="profile-grid">
          <div><strong>Date of Birth:</strong> {student.per_dateOfBirth}</div>
          <div><strong>Gender:</strong> {student.per_gender}</div>
          <div><strong>Blood Group:</strong> {student.per_bloodGroup}</div>
          <div><strong>Nationality:</strong> {student.per_nationality}</div>
          <div><strong>Mobile:</strong> {student.per_mobile}</div>
          <div><strong>Guardian Mobile:</strong> {student.stu_guardiansMobile}</div>
        </div>

        <h3>Family Information</h3>
        <div className="profile-grid">
          <div><strong>Father's Name:</strong> {student.per_fathersName}</div>
          <div><strong>Mother's Name:</strong> {student.per_mothersName}</div>
        </div>

        <h3>Address</h3>
        <div className="profile-grid">
          <div><strong>Present Address:</strong> {student.per_presentAddress}</div>
          <div><strong>Permanent Address:</strong> {student.per_permanentAddress}</div>
        </div>

        <h3>Department & Programme</h3>
        <div className="profile-grid">
          <div><strong>Department:</strong> {student.dpt_officalNameforCertificate}</div>
          <div><strong>Programme Name:</strong> {student.pro_name}</div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
