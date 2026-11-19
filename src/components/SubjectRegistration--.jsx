import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import "../styles/SubjectRegistration.css";

import {
  fetchCurrentAcademicTerm,
  createApplication,
  fetchMyApplications,
  fetchApplication,
  updateApplication,
  submitApplication,
  cancelApplication,
  addApplicationSubject,
  removeApplicationSubject,
  fetchApplicationHistory,
  fetchAvailableSubjects,
  fetchReviewQueue,
  startApplicationReview,
  requestApplicationChanges,
  approveApplication,
  rejectApplication,
} from "../services/registrationApplicationService";


/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const STATUS_LABELS = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  CHANGES_REQUESTED: "Changes Requested",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const STATUS_CLASSES = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "review",
  CHANGES_REQUESTED: "changes",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

// All registration categories are created through the same application workflow.
// Confirm the official label for reg_type = 6 with the backend/academic office.
const REGISTRATION_TYPES = [
  { value: 1, label: "Regular" },
  { value: 2, label: "Supplementary" },
  { value: 3, label: "Retake" },
  { value: 4, label: "Improvement" },
  { value: 5, label: "Other Registration (Type 6)" },
  { value: 6, label: "Special-Supplementary" },
];

function getRegistrationTypeLabel(value) {
  const type = REGISTRATION_TYPES.find(
    (item) => Number(item.value) === Number(value)
  );
  return type?.label || `Unknown Registration Type (${value ?? "—"})`;
}

const EMPTY_APPLICATION = {
  reg_type: "1",
  term: "",
  year: "",
  student_remarks: "",
};



/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getApplicationStatus(application) {
  return application?.apl_application_status || "DRAFT";
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

function getCreditHours(detail) {
  return Number(
    detail?.apd_credit_hours ??
    detail?.credit_hours ??
    detail?.module_credit_hours ??
    0
  );
}

function getSubjectId(subject) {
  return (
    subject?.offeredModuleID ??
    subject?.offered_module_id ??
    subject?.offeredModuleId
  );
}

function getSubjectCode(subject) {
  return (
    subject?.module_code ||
    subject?.mod_code ||
    subject?.course_code ||
    subject?.offered_module_code ||
    "Subject"
  );
}

function getSubjectName(subject) {
  return (
    subject?.module_title ||
    subject?.mod_name ||
    subject?.module_name ||
    subject?.course_title ||
    subject?.offered_module_name ||
    "Untitled subject"
  );
}

function getSubjectCredits(subject) {
  return Number(
    subject?.credit_hours ??
    subject?.mod_credit_hour ??
    subject?.module_credit_hours ??
    subject?.apd_credit_hours ??
    0
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getApplicationId(application) {
  return application?.application_id;
}

function getTotalCredits(details = []) {
  return details.reduce(
    (total, detail) => total + getCreditHours(detail),
    0
  );
}

function getRole(user) {
  return String(user?.usr_role || user?.role || "student")
    .trim()
    .toLowerCase();
}


/* -------------------------------------------------------------------------- */
/* Reusable Components                                                        */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }) {
  const className = STATUS_CLASSES[status] || "draft";

  return (
    <span className={`sr-status sr-status-${className}`}>
      <span className="sr-status-dot" />
      {getStatusLabel(status)}
    </span>
  );
}

function AlertMessage({ message, type = "error", onClose }) {
  if (!message) return null;

  return (
    <div
      className={`sr-alert sr-alert-${type}`}
      role="alert"
    >
      {type === "success" ? (
        <CheckCircle2 size={19} />
      ) : (
        <AlertCircle size={19} />
      )}

      <span>{message}</span>

      {onClose && (
        <button
          type="button"
          className="sr-alert-close"
          onClick={onClose}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function LoadingState({ text = "Loading..." }) {
  return (
    <div className="sr-loading">
      <Loader2 className="sr-spin" size={24} />
      <span>{text}</span>
    </div>
  );
}

function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
}) {
  return (
    <div className="sr-empty">
      <div className="sr-empty-icon">
        <Icon size={28} />
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      {action}
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function SubjectRegistration({
  user: userProp,
  student_id,
  token,
  term, 
  year 
}) {
  const user = userProp || {};

  const role = getRole(user);
  const isRegistrar = [
    "registrar",
    "admin",
    "super-admin",
  ].includes(role);

  const studentId =
    user?.student_id ||
    user?.studentID ||
    user?.studentId ||
    "";

  const [activeTab, setActiveTab] = useState(
    isRegistrar ? "queue" : "dashboard"
  );

 
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [reviewQueue, setReviewQueue] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [remarks, setRemarks] = useState("");
  const [cancelRemarks, setCancelRemarks] = useState("");
  const [reviewRemarks, setReviewRemarks] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  /*const [applicationForm, setApplicationForm] = useState(
    EMPTY_APPLICATION
  );*/
  const [applicationForm, setApplicationForm] = useState({
  reg_type: 1,
  term: term,
  year: year,
  student_remarks: "",
});

  const [reviewAction, setReviewAction] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Load Initial Data                                                        */
  /* ------------------------------------------------------------------------ */

  const loadInitialData = useCallback(async () => {
  try {
    setLoading(true);
    setError("");

    // Registrar: Load review queue
    if (isRegistrar) {
      const queue = await fetchReviewQueue();
      setReviewQueue(queue || []);
      return;
    }

    // Student: Validate authentication
    if (!student_id || !token) {
      setApplications([]);
      setError("Student information or authentication token is missing.");
      return;
    }

    // Fetch student's applications
    const applicationData = await fetchMyApplications(
      student_id,
      token
    );

    //console.log("Fetched applications:", applicationData);

    // Ensure the response is an array
    const applicationsList = Array.isArray(applicationData)
      ? applicationData
      : applicationData?.applications || [];

    setApplications(applicationsList);

    setApplicationForm({
      reg_type: "1",
      term,
      year,
      student_remarks: "",
    });

  } catch (err) {
    console.error("Failed to load registration applications:", err);

    setError(
      getErrorMessage(err) ||
      "Unable to load registration applications."
    );

    setApplications([]);
  } finally {
    setLoading(false);
  }
}, [
  isRegistrar,
  student_id,
  token,
  term,
  year,
]);

useEffect(() => {
  loadInitialData();
}, [loadInitialData]);

 
  /* ------------------------------------------------------------------------ */
  /* Load Available Subjects                                                  */
  /* ------------------------------------------------------------------------ */

  function getRegistrationType(application) {
  const rawValue =
    application?.reg_type ??
    application?.apl_reg_type ??
    application?.registration_type;

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null;
  }

  const value = Number(rawValue);

  return Number.isInteger(value) ? value : null;
}
 
  const loadAvailableSubjects = useCallback(async () => {
    if (!selectedApplication) return;

    try {      
    const regType = Number.isInteger(selectedApplication.reg_type) ? selectedApplication.reg_type : null; 
    const applicationTerm = Number(selectedApplication.apl_term);
    const applicationYear = Number(selectedApplication.apl_year);

    console.log("Registration parameters:", {
      regType,
      applicationTerm,
      applicationYear,
      selectedApplication,
    });

    if (
      regType === null ||
      !Number.isInteger(applicationTerm) ||
      !Number.isInteger(applicationYear)
    ) {
      throw new Error(
        "Invalid application data: registration type, term, or year is missing."
      );
    }

      const subjects = await fetchAvailableSubjects(
          Number(selectedApplication.reg_type),
          Number(selectedApplication.apl_term),
          Number(selectedApplication.apl_year)
        );

      setAvailableSubjects(subjects || []);
    } catch (err) {
      setAvailableSubjects([]);
      setError(
        `Unable to load available subjects: ${getErrorMessage(err)}`
      );
    }
  }, [selectedApplication]);

  useEffect(() => {
    if (activeTab === "subjects" && selectedApplication) {
      loadAvailableSubjects();
    }
  }, [activeTab, selectedApplication, loadAvailableSubjects]);


  /* ------------------------------------------------------------------------ */
  /* Application Selection                                                    */
  /* ------------------------------------------------------------------------ */

  const openApplication = async (applicationId, tab = "subjects") => {
    try {
      setDetailLoading(true);
      setError("");
      setSuccess("");

      const application = await fetchApplication(applicationId);

      setSelectedApplication(application);
      setRemarks(application?.apl_student_remarks || "");
      setActiveTab(tab);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };


  /* ------------------------------------------------------------------------ */
  /* Create Application                                                       */
  /* ------------------------------------------------------------------------ */

  const handleCreateApplication = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");            
      if (!applicationForm.reg_type) {
        setError("Please select a registration type.");
        return;
      }      
      const payload = {            
        term: Number(applicationForm.term),
        year: Number(applicationForm.year),
        student_remarks:
          applicationForm.student_remarks?.trim() || null,
        application_type: Number(applicationForm.reg_type) || 1,    
      };      
      const created = await createApplication(payload);

      const applicationId = getApplicationId(created);

      setShowCreateModal(false);

      setSuccess("Registration application created successfully.");

      await loadInitialData();

      if (applicationId) {
        await openApplication(applicationId, "subjects");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };


  /* ------------------------------------------------------------------------ */
  /* Update Application Remarks                                               */
  /* ------------------------------------------------------------------------ */

  const handleSaveRemarks = async () => {
    if (!selectedApplication) return;

    try {
      setSaving(true);
      setError("");

      const updated = await updateApplication(
        selectedApplication.application_id,
        {
          student_remarks: remarks.trim() || null,
        }
      );

      setSelectedApplication(updated);

      setSuccess("Application remarks updated successfully.");

      await loadInitialData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };


  /* ------------------------------------------------------------------------ */
  /* Add Subject                                                              */
  /* ------------------------------------------------------------------------ */

  const handleAddSubject = async (subject) => {
    
    if (!selectedApplication) return;

    const offeredModuleId = subject.offeredModuleID; //getSubjectId(subject);
  
    if (!offeredModuleId) {
      setError("This subject does not have a valid offered module ID.");
      return;
    }
    
    const alreadyAdded = selectedApplication.details?.some(
      (detail) =>
        String(detail.offeredModuleID) === String(offeredModuleId)
    );
   
    if (alreadyAdded) {
      setError("This subject has already been added.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      
      const updated = await addApplicationSubject(
        selectedApplication.application_id,
        {
          offeredModuleID: Number(offeredModuleId),
          credit_hours: getSubjectCredits(subject),
          remarks: null,
        }
      );

      const refreshed = await fetchApplication(
        selectedApplication.application_id
      );

      setSelectedApplication(refreshed || updated);

      setSuccess("Subject added to your application.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };


  /* ------------------------------------------------------------------------ */
  /* Remove Subject                                                           */
  /* ------------------------------------------------------------------------ */

  const handleRemoveSubject = async (detail) => {
    if (!selectedApplication || !detail?.application_detail_id) {
      return;
    }

    if (!window.confirm("Remove this subject from your application?")) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await removeApplicationSubject(
        selectedApplication.application_id,
        detail.application_detail_id
      );

      const refreshed = await fetchApplication(
        selectedApplication.application_id
      );

      setSelectedApplication(refreshed);

      setSuccess("Subject removed successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };


  /* ------------------------------------------------------------------------ */
  /* Submit Application                                                       */
  /* ------------------------------------------------------------------------ */

  const handleSubmitApplication = async () => {
    if (!selectedApplication) return;

    const subjectCount = selectedApplication.details?.length || 0;

    if (subjectCount === 0) {
      setError("Please add at least one subject before submitting.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to submit this registration application? You may not be able to edit it after submission."
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");

      await submitApplication(selectedApplication.application_id);

      const refreshed = await fetchApplication(
        selectedApplication.application_id
      );

      setSelectedApplication(refreshed);

      setSuccess("Your registration application has been submitted.");

      await loadInitialData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Cancel Application                                                       */
  /* ------------------------------------------------------------------------ */

  const handleCancelApplication = async (event) => {
    event.preventDefault();

    if (!selectedApplication) return;

    try {
      setSaving(true);
      setError("");

      await cancelApplication(
        selectedApplication.application_id,
        cancelRemarks.trim()
      );

      const refreshed = await fetchApplication(
        selectedApplication.application_id
      );

      setSelectedApplication(refreshed);

      setShowCancelModal(false);
      setCancelRemarks("");

      setSuccess("Application cancelled successfully.");

      await loadInitialData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };


  /* ------------------------------------------------------------------------ */
  /* Application History                                                     */
  /* ------------------------------------------------------------------------ */

  const openHistory = async (application) => {
    try {
      setDetailLoading(true);
      setError("");

      setSelectedApplication(application);

      const data = await fetchApplicationHistory(
        application.application_id
      );

      setHistory(data || []);
      setActiveTab("history");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };


  /* ------------------------------------------------------------------------ */
  /* Registrar Review                                                        */
  /* ------------------------------------------------------------------------ */

  const refreshReviewQueue = async () => {
    try {
      setLoading(true);
      setError("");

      const queue = await fetchReviewQueue();

      setReviewQueue(queue || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (event) => {
    event.preventDefault();

    if (!selectedApplication || !reviewAction) return;

    try {
      setSaving(true);
      setError("");

      const applicationId = selectedApplication.application_id;
      const reviewText = reviewRemarks.trim();

      if (reviewAction === "start") {
        await startApplicationReview(applicationId, {
          remarks: reviewText || null,
        });
      } else if (reviewAction === "changes") {
        if (!reviewText) {
          setError("Please enter the changes required.");
          return;
        }

        await requestApplicationChanges(applicationId, reviewText);
      } else if (reviewAction === "approve") {
        await approveApplication(applicationId, reviewText);
      } else if (reviewAction === "reject") {
        if (!reviewText) {
          setError("Please provide a reason for rejection.");
          return;
        }

        await rejectApplication(applicationId, reviewText);
      }

      setShowReviewModal(false);
      setReviewRemarks("");
      setReviewAction("");

      setSuccess("Application review action completed.");

      await refreshReviewQueue();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };


  /* ------------------------------------------------------------------------ */
  /* Search / Calculations                                                    */
  /* ------------------------------------------------------------------------ */

const filteredSubjects = (availableSubjects || []).filter((subject) => {
  const searchText = search.trim().toLowerCase();

  if (!searchText) return true;

  return (
    String(subject.moduleCode || "").toLowerCase().includes(searchText) ||
    String(subject.mod_name || "").toLowerCase().includes(searchText) ||
    String(subject.mod_group || "").toLowerCase().includes(searchText) ||
    String(subject.mod_type || "").toLowerCase().includes(searchText) ||
    String(subject.offeredModuleID || "").toLowerCase().includes(searchText)
  );
});
 
  const selectedDetails = selectedApplication?.details || [];

  const totalCredits = getTotalCredits(selectedDetails);

  const selectedSubjectIds = useMemo(
    () =>
      new Set(
        selectedDetails.map((detail) =>
          String(detail.offeredModuleID)
        )
      ),
    [selectedDetails]
  );

  const draftCount = applications.filter(
    (app) => getApplicationStatus(app) === "DRAFT"
  ).length;

  const submittedCount = applications.filter((app) =>
    ["SUBMITTED", "UNDER_REVIEW"].includes(
      getApplicationStatus(app)
    )
  ).length;

  const approvedCount = applications.filter(
    (app) => getApplicationStatus(app) === "APPROVED"
  ).length;

  const isEditable = selectedApplication
    ? ["DRAFT", "CHANGES_REQUESTED"].includes(
        getApplicationStatus(selectedApplication)
      )
    : false;


  /* ------------------------------------------------------------------------ */
  /* Page Header                                                              */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="subject-registration-page">

      <div className="sr-page-header">
        <div className="sr-page-heading">
          <div className="sr-heading-icon">
            <GraduationCap size={25} />
          </div>

          <div>
            <h1>Subject Registration</h1>
            <p>
              Manage your academic subject registration and track
              application progress.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="sr-refresh-button"
          onClick={isRegistrar ? refreshReviewQueue : loadInitialData}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "sr-spin" : ""}
          />
          Refresh
        </button>
      </div>


      <AlertMessage
        message={error}
        type="error"
        onClose={() => setError("")}
      />

      <AlertMessage
        message={success}
        type="success"
        onClose={() => setSuccess("")}
      />


      {/* ------------------------------------------------------------------ */}
      {/* Registrar Navigation                                               */}
      {/* ------------------------------------------------------------------ */}

      {isRegistrar ? (
        <div className="sr-tabs">
          <button
            type="button"
            className={activeTab === "queue" ? "active" : ""}
            onClick={() => setActiveTab("queue")}
          >
            <ShieldCheck size={17} />
            Review Queue
            <span className="sr-tab-count">{reviewQueue.length}</span>
          </button>
        </div>
      ) : (
        <div className="sr-tabs">
          <button
            type="button"
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            <FileText size={17} />
            My Applications
          </button>

          {selectedApplication && (
            <>
              <button
                type="button"
                className={activeTab === "subjects" ? "active" : ""}
                onClick={() => setActiveTab("subjects")}
              >
                <BookOpen size={17} />
                Subject Selection
              </button>

              <button
                type="button"
                className={activeTab === "history" ? "active" : ""}
                onClick={() => openHistory(selectedApplication)}
              >
                <History size={17} />
                History
              </button>
            </>
          )}
        </div>
      )}


      {loading ? (
        <LoadingState text="Loading registration information..." />
      ) : detailLoading ? (
        <LoadingState text="Loading application details..." />
      ) : (
        <>
          {/* ============================================================ */}
          {/* STUDENT DASHBOARD                                            */}
          {/* ============================================================ */}

          {!isRegistrar && activeTab === "dashboard" && (
            <>
              <div className="sr-term-banner">
                <div className="sr-term-banner-icon">
                  <CalendarDays size={23} />
                </div>

                <div>
                  <span>Current Academic Session</span>
                  <h2>
                    {term === 1
                      ? "Spring"
                      : term === 2
                      ? "Summer"
                      : term === 3
                      ? "Autumn"
                      : "Current"}{" "}
                    {year || "—"}
                  </h2>
                </div>

                <div className="sr-term-banner-right">
                  <span>Student ID</span>
                  <strong>{studentId || "—"}</strong>
                </div>
              </div>


              <div className="sr-stat-grid">
                <div className="sr-stat-card">
                  <div className="sr-stat-icon purple">
                    <FileText size={22} />
                  </div>
                  <div>
                    <span>Total Applications</span>
                    <strong>{applications.length}</strong>
                  </div>
                </div>

                <div className="sr-stat-card">
                  <div className="sr-stat-icon orange">
                    <Clock3 size={22} />
                  </div>
                  <div>
                    <span>Pending Review</span>
                    <strong>{submittedCount}</strong>
                  </div>
                </div>

                <div className="sr-stat-card">
                  <div className="sr-stat-icon green">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <span>Approved</span>
                    <strong>{approvedCount}</strong>
                  </div>
                </div>

                <div className="sr-stat-card">
                  <div className="sr-stat-icon blue">
                    <FileText size={22} />
                  </div>
                  <div>
                    <span>Draft Applications</span>
                    <strong>{draftCount}</strong>
                  </div>
                </div>
              </div>


              <div className="sr-section-heading">
                <div>
                  <h2>My Registration Applications</h2>
                  <p>
                    View, continue, and track your subject registration
                    applications.
                  </p>
                </div>

                <button
                  type="button"
                  className="sr-primary-button"
                  onClick={() => {
                    setApplicationForm({
                      reg_type: "1",
                      term: term,
                      year: year,
                      student_remarks: "",
                    });
                    setShowCreateModal(true);
                  }}
                >
                  <Plus size={17} />
                  New Application
                </button>
              </div>


              {applications.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No registration applications"
                  description="You have not created a subject registration application yet."
                  action={
                    <button
                      type="button"
                      className="sr-primary-button"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus size={17} />
                      Create Application
                    </button>
                  }
                />
              ) : (
                <div className="sr-table-card">
                  <div className="sr-table-wrapper">
                    <table className="sr-table">
                      <thead>
                        <tr>
                          <th>Application No.</th>
                          <th>Registration Type</th>
                          <th>Academic Term</th>
                          <th>Credit Hours</th>
                          <th>Submitted Date</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {applications.map((application) => (
                          <tr key={application.application_id}>
                            <td>
                              <strong className="sr-application-no">
                                {application.application_no}
                              </strong>
                            </td>

                            <td>{getRegistrationTypeLabel(application.reg_type)}</td>

                            <td>
                              {application.apl_term === 1
                                    ? "Spring"
                                    : application.apl_term === 2
                                    ? "Summer"
                                    : application.apl_term === 3
                                    ? "Autumn"
                                    : "Current"},{" "}
                              {application.apl_year}
                            </td>

                            <td>
                              {Number(
                                application.apl_total_credit_hours || 0
                              ).toFixed(2)}
                            </td>

                            <td>
                              {formatDate(application.apl_submitted_at)}
                            </td>

                            <td>
                              <StatusBadge
                                status={getApplicationStatus(application)}
                              />
                            </td>

                            <td>
                              <div className="sr-action-buttons">
                                <button
                                  type="button"
                                  className="sr-icon-button"
                                  title="Open application"
                                  onClick={() =>
                                    openApplication(
                                      application.application_id
                                    )
                                  }
                                >
                                  <ArrowRight size={17} />
                                </button>

                                <button
                                  type="button"
                                  className="sr-icon-button"
                                  title="View history"
                                  onClick={() => openHistory(application)}
                                >
                                  <History size={17} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}


{/* ============================================================ */}
{/* SUBJECT SELECTION                                            */}
{/* ============================================================ */}


{/* ============================================================ */}
{/* SUBJECT SELECTION                                            */}
{/* ============================================================ */}

{!isRegistrar && activeTab === "subjects" && selectedApplication && (
  <>
    {/* Back navigation and status */}
    <div className="sr-back-row">
      <button
        type="button"
        className="sr-back-button"
        onClick={() => setActiveTab("dashboard")}
      >
        <ArrowLeft size={17} />
        Back to Applications
      </button>

      <StatusBadge
        status={getApplicationStatus(selectedApplication)}
      />
    </div>

    {/* Application information */}
    <div className="sr-application-banner">
      <div>
        <span>Registration Application</span>
        <h2>{selectedApplication.application_no}</h2>
        <p>
          <strong>{getRegistrationTypeLabel(selectedApplication.reg_type)}</strong>
          <span> · </span>
          {selectedApplication.apl_term === 1
                                    ? "Spring"
                                    : selectedApplication.apl_term === 2
                                    ? "Summer"
                                    : selectedApplication.apl_term === 3
                                    ? "Autumn"
                                    : "Current"},{" "}                              
          
          {selectedApplication.apl_year}
        </p>
      </div>

      <div className="sr-application-banner-stat">
        <span>Selected Credits</span>
        <strong>{Number(totalCredits || 0).toFixed(2)}</strong>
      </div>

      <div className="sr-application-banner-stat">
        <span>Selected Subjects</span>
        <strong>{selectedDetails.length}</strong>
      </div>
    </div>

    {/* Reviewer remarks */}
    {selectedApplication.apl_application_status ===
      "CHANGES_REQUESTED" && (
      <AlertMessage
        message={
          selectedApplication.apl_reviewer_remarks ||
          "The registrar has requested changes to your application."
        }
        type="error"
      />
    )}

    <div className="sr-selection-layout">

      {/* ====================================================== */}
      {/* AVAILABLE SUBJECTS                                     */}
      {/* ====================================================== */}

      <section className="sr-subject-panel">

        <div className="sr-panel-heading">
          <div>
            <h2>Available Subjects</h2>
            <p>
              Select the subjects you want to include in your
              registration application.
            </p>
          </div>

          <span className="sr-result-count">
            {filteredSubjects.length} Subjects
          </span>
        </div>

        {/* Search */}
        <div className="sr-search-box">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search module code, subject name, group or type..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {/* Available subject list */}
        {filteredSubjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No available subjects"
            description="No matching subjects were found for this academic term."
          />
        ) : (
          <div className="sr-subject-list">

            {filteredSubjects.map((subject) => {
              const subjectId = subject.offeredModuleID;

              const isAdded = selectedSubjectIds.has(
                String(subjectId)
              );

              return (
                <div
                  className="sr-subject-item"
                  key={subjectId}
                >
                  <div className="sr-subject-info">

                    {/* Module code */}
                    <div className="sr-subject-code">
                      {subject.moduleCode || "N/A"}
                    </div>

                    {/* Subject name */}
                    <h3>
                      {subject.mod_name || "Unnamed Subject"}
                    </h3>

                    {/* Subject information */}
                    <div className="sr-subject-meta">
                      <span>
                        <strong>Credits:</strong>{" "}
                        {Number(subject.mod_creditHour || 0).toFixed(2)}
                      </span>

                      <span>
                        <strong>Group:</strong>{" "}
                        {subject.mod_group || "N/A"}
                      </span>

                      <span>
                        <strong>Type:</strong>{" "}
                        {subject.mod_type || "N/A"}
                      </span>
                    </div>

                    {/* Offered module ID */}
                    <small className="sr-offered-module-id">
                      Offered Module ID: {subjectId}
                    </small>

                  </div>

                  {/* Add subject */}
                  <button
                    type="button"
                    className={
                      isAdded
                        ? "sr-added-button"
                        : "sr-add-button"
                    }
                    disabled={
                      isAdded ||
                      saving ||
                      !isEditable ||
                      !subjectId
                    }
                    onClick={() => handleAddSubject(subject)}
                  >
                    {isAdded ? (
                      <>
                        <Check size={16} />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add
                      </>
                    )}
                  </button>

                </div>
              );
            })}

          </div>
        )}
      </section>

      {/* ====================================================== */}
      {/* SELECTED SUBJECTS                                      */}
      {/* ====================================================== */}

      <aside className="sr-selected-panel">

        <div className="sr-panel-heading">
          <div>
            <h2>Selected Subjects</h2>
            <p>Your registration summary</p>
          </div>

          <span className="sr-selected-count">
            {selectedDetails.length}
          </span>
        </div>

        {/* Selected subject list */}
        {selectedDetails.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects selected"
            description="Add subjects from the available subjects list."
          />
        ) : (
          <div className="sr-selected-list">

            {selectedDetails.map((detail) => (
              <div
                className="sr-selected-item"
                key={
                  detail.application_detail_id ||
                  detail.offeredModuleID
                }
              >
                <div>
                  <strong>
                    {detail.moduleCode ||
                      detail.module_code ||
                      detail.offeredModuleID}
                  </strong>

                  <span>
                    {detail.mod_name ||
                      detail.module_title ||
                      detail.module_name ||
                      "Selected subject"}
                  </span>

                  <small>
                    {Number(
                      detail.apd_credit_hours ??
                      detail.mod_creditHour ??
                      detail.credit_hours ??
                      0
                    ).toFixed(2)} Credits
                  </small>

                  <small>
                    Offered Module ID: {detail.offeredModuleID}
                  </small>
                </div>

                {isEditable && (
                  <button
                    type="button"
                    className="sr-remove-button"
                    title="Remove subject"
                    disabled={saving}
                    onClick={() => handleRemoveSubject(detail)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}

          </div>
        )}

        {/* Credit summary */}
        <div className="sr-credit-summary">
          <span>Total Credit Hours</span>
          <strong>
            {Number(totalCredits || 0).toFixed(2)}
          </strong>
        </div>

        {/* Student remarks */}
        <div className="sr-remarks-field">
          <label htmlFor="student-remarks">
            Student Remarks
          </label>

          <textarea
            id="student-remarks"
            rows={3}
            placeholder="Write any remarks (optional)..."
            value={remarks}
            disabled={!isEditable || saving}
            onChange={(event) => setRemarks(event.target.value)}
          />

          {isEditable && (
            <button
              type="button"
              className="sr-secondary-button sr-save-remarks"
              disabled={saving}
              onClick={handleSaveRemarks}
            >
              Save Remarks
            </button>
          )}
        </div>

        {/* Application actions */}
        {isEditable && (
          <div className="sr-submit-actions">

            <button
              type="button"
              className="sr-primary-button sr-full-button"
              disabled={
                saving || selectedDetails.length === 0
              }
              onClick={handleSubmitApplication}
            >
              {saving ? (
                <Loader2 size={17} className="sr-spin" />
              ) : (
                <Send size={17} />
              )}

              Submit Application
            </button>

            <button
              type="button"
              className="sr-cancel-button"
              onClick={() => setShowCancelModal(true)}
              disabled={saving}
            >
              Cancel Application
            </button>

          </div>
        )}

        {!isEditable && (
          <div className="sr-readonly-note">
            <ShieldCheck size={17} />
            This application is read-only in its current status.
          </div>
        )}

      </aside>
    </div>
  </>
)}
          {/* ============================================================ */}
          {/* APPLICATION HISTORY                                         */}
          {/* ============================================================ */}

          {!isRegistrar && activeTab === "history" && selectedApplication && (
            <>
              <div className="sr-back-row">
                <button
                  type="button"
                  className="sr-back-button"
                  onClick={() => setActiveTab("subjects")}
                >
                  <ArrowLeft size={17} />
                  Back to Application
                </button>

                <StatusBadge
                  status={getApplicationStatus(selectedApplication)}
                />
              </div>

              <div className="sr-history-card">
                <div className="sr-panel-heading">
                  <div>
                    <h2>Application History</h2>
                    <p>
                      {selectedApplication.application_no}
                    </p>
                  </div>
                </div>

                {history.length === 0 ? (
                  <EmptyState
                    icon={History}
                    title="No history available"
                    description="No activity has been recorded for this application."
                  />
                ) : (
                  <div className="sr-timeline">
                    {history.map((item) => (
                      <div
                        className="sr-timeline-item"
                        key={item.history_id}
                      >
                        <div className="sr-timeline-marker">
                          <History size={16} />
                        </div>

                        <div className="sr-timeline-content">
                          <div className="sr-timeline-heading">
                            <strong>
                              {(item.aph_action_type || "")
                                .replaceAll("_", " ")}
                            </strong>

                            <span>
                              {formatDate(item.aph_action_at)}
                            </span>
                          </div>

                          <div className="sr-timeline-status">
                            {item.aph_previous_status || "NEW"}
                            <ArrowRight size={14} />
                            {item.aph_new_status}
                          </div>

                          {item.aph_action_remarks && (
                            <p>{item.aph_action_remarks}</p>
                          )}

                          <small>
                            By: {item.aph_action_by}
                            {item.aph_action_by_role
                              ? ` (${item.aph_action_by_role})`
                              : ""}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}


          {/* ============================================================ */}
          {/* REGISTRAR REVIEW QUEUE                                      */}
          {/* ============================================================ */}

          {isRegistrar && activeTab === "queue" && (
            <>
              <div className="sr-section-heading">
                <div>
                  <h2>Registration Review Queue</h2>
                  <p>
                    Review submitted student subject registration
                    applications.
                  </p>
                </div>

                <span className="sr-queue-count">
                  {reviewQueue.length} Applications
                </span>
              </div>


              {reviewQueue.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="No applications awaiting review"
                  description="Submitted registration applications will appear here."
                />
              ) : (
                <div className="sr-table-card">
                  <div className="sr-table-wrapper">
                    <table className="sr-table">
                      <thead>
                        <tr>
                          <th>Application No.</th>
                          <th>Student ID</th>
                          <th>Registration Type</th>
                          <th>Term</th>
                          <th>Credit Hours</th>
                          <th>Submitted</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {reviewQueue.map((application) => (
                          <tr key={application.application_id}>
                            <td>
                              <strong className="sr-application-no">
                                {application.application_no}
                              </strong>
                            </td>

                            <td>{application.studentID}</td>

                            <td>{getRegistrationTypeLabel(application.reg_type)}</td>

                            <td>
                              {application.apl_term},{" "}
                              {application.apl_year}
                            </td>

                            <td>
                              {Number(
                                application.apl_total_credit_hours || 0
                              ).toFixed(2)}
                            </td>

                            <td>
                              {formatDate(application.apl_submitted_at)}
                            </td>

                            <td>
                              <StatusBadge
                                status={getApplicationStatus(application)}
                              />
                            </td>

                            <td>
                              <button
                                type="button"
                                className="sr-primary-button sr-small-button"
                                onClick={async () => {
                                  await openApplication(
                                    application.application_id,
                                    "review"
                                  );
                                  setShowReviewModal(false);
                                }}
                              >
                                Review
                                <ArrowRight size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}


              {selectedApplication && activeTab === "review" && (
                <div className="sr-review-detail">
                  <div className="sr-back-row">
                    <button
                      type="button"
                      className="sr-back-button"
                      onClick={() => {
                        setSelectedApplication(null);
                        setActiveTab("queue");
                      }}
                    >
                      <ArrowLeft size={17} />
                      Back to Queue
                    </button>

                    <StatusBadge
                      status={getApplicationStatus(selectedApplication)}
                    />
                  </div>

                  <div className="sr-application-banner">
                    <div>
                      <span>Application</span>
                      <h2>{selectedApplication.application_no}</h2>
                      <p>
                        Student ID: {selectedApplication.studentID}
                      </p>
                      <p>
                        <strong>{getRegistrationTypeLabel(selectedApplication.reg_type)}</strong>
                      </p>
                    </div>

                    <div className="sr-application-banner-stat">
                      <span>Term / Year</span>
                      <strong>
                        {selectedApplication.apl_term === 1
                                    ? "Spring"
                                    : selectedApplication.apl_term === 2
                                    ? "Summer"
                                    : selectedApplication.apl_term === 3
                                    ? "Autumn"
                                    : "Current"},{" "}
                              {selectedApplication.apl_year}
                        
                      </strong>
                    </div>

                    <div className="sr-application-banner-stat">
                      <span>Total Credits</span>
                      <strong>
                        {Number(
                          selectedApplication.apl_total_credit_hours || 0
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="sr-table-card">
                    <div className="sr-panel-heading">
                      <div>
                        <h2>Requested Subjects</h2>
                        <p>Subjects submitted by the student.</p>
                      </div>
                    </div>

                    <div className="sr-table-wrapper">
                      <table className="sr-table">
                        <thead>
                          <tr>
                            <th>Offered Module ID</th>
                            <th>Subject</th>
                            <th>Credit Hours</th>
                          </tr>
                        </thead>

                        <tbody>
                          {(selectedApplication.details || []).map(
                            (detail) => (
                              <tr key={detail.application_detail_id}>
                                <td>{detail.offeredModuleID}</td>
                                <td>
                                  {detail.module_code || "—"}
                                  {detail.module_title
                                    ? ` — ${detail.module_title}`
                                    : ""}
                                </td>
                                <td>
                                  {getCreditHours(detail).toFixed(2)}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="sr-review-actions">
                    <h3>Review Decision</h3>

                    <div className="sr-review-action-grid">
                      <button
                        type="button"
                        className="sr-secondary-button"
                        onClick={() => {
                          setReviewAction("start");
                          setShowReviewModal(true);
                        }}
                        disabled={
                          getApplicationStatus(selectedApplication) !==
                          "SUBMITTED"
                        }
                      >
                        <Clock3 size={17} />
                        Start Review
                      </button>

                      <button
                        type="button"
                        className="sr-warning-button"
                        onClick={() => {
                          setReviewAction("changes");
                          setShowReviewModal(true);
                        }}
                      >
                        <AlertCircle size={17} />
                        Request Changes
                      </button>

                      <button
                        type="button"
                        className="sr-approve-button"
                        onClick={() => {
                          setReviewAction("approve");
                          setShowReviewModal(true);
                        }}
                      >
                        <CheckCircle2 size={17} />
                        Approve
                      </button>

                      <button
                        type="button"
                        className="sr-reject-button"
                        onClick={() => {
                          setReviewAction("reject");
                          setShowReviewModal(true);
                        }}
                      >
                        <X size={17} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}


      {/* ================================================================ */}
      {/* CREATE APPLICATION MODAL                                         */}
      {/* ================================================================ */}

      {showCreateModal && (
        <div
          className="sr-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowCreateModal(false);
            }
          }}
        >
          <div className="sr-modal">
            <div className="sr-modal-header">
              <div>
                <h2>Create Registration Application</h2>
                <p>Create a Regular, Supplementary, Retake, Improvement, or Special-Supplementary application from one place.</p>
              </div>

              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateApplication}>
             <div className="sr-form-field">
                      <label htmlFor="sr-registration-type">
                        Registration Type
                      </label>

                      <select
                        id="sr-registration-type"
                        name="reg_type"
                        value={applicationForm.reg_type ?? 1}
                        onChange={(event) => {
                          const selectedType = Number(event.target.value);

                          setApplicationForm((previous) => ({
                            ...previous,
                            reg_type: selectedType,
                          }));
                        }}
                        required
                        disabled={saving}
                      >
                        {REGISTRATION_TYPES.map((registrationType) => (
                          <option
                            key={registrationType.value}
                            value={registrationType.value}
                          >
                            {registrationType.label}
                          </option>
                        ))}
                      </select>

                      <small>
                        Select the registration category for this application.
                      </small>
</div>

              <div className="sr-form-grid">
                <div className="sr-form-field">
                  <label>Academic Term</label>
                  <h1>
                    {term === 1
                      ? "Spring"
                      : term === 2
                      ? "Summer"
                      : term === 3
                      ? "Autumn"
                      : "Current"}{" "}
                  </h1>
               
                </div>

                <div className="sr-form-field">
                  <label>Academic Year</label>
                  <h1>{year}</h1>
                </div>
              </div>

              <div className="sr-form-field">
                <label>Student Remarks (Optional)</label>
                <textarea
                  rows={3}
                  maxLength={10000}
                  placeholder="Enter any additional information..."
                  value={applicationForm.student_remarks}
                  onChange={(event) =>
                    setApplicationForm((previous) => ({
                      ...previous,
                      student_remarks: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="sr-modal-actions">
                <button
                  type="button"
                  className="sr-secondary-button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sr-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={17} className="sr-spin" />
                  ) : (
                    <Plus size={17} />
                  )}
                  Create Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ================================================================ */}
      {/* CANCEL APPLICATION MODAL                                         */}
      {/* ================================================================ */}

      {showCancelModal && (
        <div className="sr-modal-overlay">
          <div className="sr-modal">
            <div className="sr-modal-header">
              <div>
                <h2>Cancel Application</h2>
                <p>
                  Please provide a reason for cancelling this application.
                </p>
              </div>

              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setShowCancelModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCancelApplication}>
              <div className="sr-form-field">
                <label>Cancellation Remarks</label>
                <textarea
                  rows={4}
                  maxLength={10000}
                  placeholder="Enter cancellation reason..."
                  value={cancelRemarks}
                  onChange={(event) =>
                    setCancelRemarks(event.target.value)
                  }
                />
              </div>

              <div className="sr-modal-actions">
                <button
                  type="button"
                  className="sr-secondary-button"
                  onClick={() => setShowCancelModal(false)}
                >
                  Keep Application
                </button>

                <button
                  type="submit"
                  className="sr-reject-button"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={17} className="sr-spin" />
                  ) : (
                    <X size={17} />
                  )}
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ================================================================ */}
      {/* REGISTRAR REVIEW MODAL                                           */}
      {/* ================================================================ */}

      {showReviewModal && (
        <div className="sr-modal-overlay">
          <div className="sr-modal">
            <div className="sr-modal-header">
              <div>
                <h2>
                  {reviewAction === "start" && "Start Application Review"}
                  {reviewAction === "changes" && "Request Changes"}
                  {reviewAction === "approve" && "Approve Application"}
                  {reviewAction === "reject" && "Reject Application"}
                </h2>

                <p>
                  Application: {selectedApplication?.application_no}
                </p>
              </div>

              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setShowReviewModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReviewAction}>
              <div className="sr-form-field">
                <label>
                  {reviewAction === "changes"
                    ? "Required Changes"
                    : reviewAction === "reject"
                    ? "Reason for Rejection"
                    : "Review Remarks"}
                </label>

                <textarea
                  rows={4}
                  maxLength={10000}
                  required={
                    reviewAction === "changes" ||
                    reviewAction === "reject"
                  }
                  placeholder="Enter review remarks..."
                  value={reviewRemarks}
                  onChange={(event) =>
                    setReviewRemarks(event.target.value)
                  }
                />
              </div>

              <div className="sr-modal-actions">
                <button
                  type="button"
                  className="sr-secondary-button"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    reviewAction === "reject"
                      ? "sr-reject-button"
                      : reviewAction === "approve"
                      ? "sr-approve-button"
                      : "sr-primary-button"
                  }
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 size={17} className="sr-spin" />
                  ) : (
                    <Check size={17} />
                  )}
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}