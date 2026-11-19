
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  History,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import "../styles/SubjectRegistration.css";
import RegistrationApplicationDetail from "./RegistrationApplicationDetail";

import {
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

const MAX_NON_REGULAR_SUBJECTS = 2;

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

const REGISTRATION_TYPES = [
  { value: 1, label: "Regular" },
  { value: 2, label: "Retake" },
  { value: 3, label: "Supplementary" },
  { value: 4, label: "Improvement" },
  { value: 5, label: "Other Registration (Type 6)" },
  { value: 6, label: "Special-Supplementary" },
  { value: 7, label: "Transcript" },
  { value: 8, label: "Provisional Certificate" },
  { value: 9, label: "Final / Main Certificate" },
  { value: 10, label: "MOI Certificate" },
  { value: 11, label: "Studentship Certificate" },

];

const EMPTY_APPLICATION = {
  reg_type: 1,
  term: "",
  year: "",
  student_remarks: "",
};

/* -------------------------------------------------------------------------- */
/* General Helpers                                                            */
/* -------------------------------------------------------------------------- */

function getErrorMessage(error) {
  const detail = error?.response?.data?.detail;
  const message = error?.response?.data?.message;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || JSON.stringify(item))
      .join(", ");
  }

  return (
    detail ||
    message ||
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

function getRegistrationType(application) {
  // The database field must take priority over older frontend aliases.
  const rawValue =
    application?.apl_application_type ??
    application?.application_type ??
    application?.regi_type ??
    application?.reg_type ??
    application?.apl_reg_type ??
    application?.registration_type;

  if (
    rawValue === null ||
    rawValue === undefined ||
    rawValue === ""
  ) {
    return null;
  }

  const value = Number(rawValue);

  return Number.isInteger(value) ? value : null;
}

function getRegistrationTypeLabel(value) {
  const type = REGISTRATION_TYPES.find(
    (item) => Number(item.value) === Number(value)
  );

  return (
    type?.label ||
    `Unknown Registration Type (${value ?? "—"})`
  );
}

function isSupplementaryType(registrationType) {
  return Number(registrationType) === 3;
}

function isRegularType(registrationType) {
  return Number(registrationType) === 1;
}

/**
 * Returns the correct subject ID based on registration type.
 *
 * Supplementary:
 *   moduleRegistrationID
 *
 * Other registration types:
 *   offeredModuleID
 */
function getSubjectIdForType(subject, registrationType) {
  if (isSupplementaryType(registrationType)) {
    return (
      subject?.moduleRegistrationID ??
      subject?.module_registration_id ??
      subject?.moduleRegistrationId
    );
  }

  return (
    subject?.offeredModuleID ??
    subject?.offered_module_id ??
    subject?.offeredModuleId
  );
}

function getCreditHours(detail) {
  return Number(
    detail?.apd_credit_hours ??
      detail?.credit_hours ??
      detail?.module_credit_hours ??
      detail?.mod_creditHour ??
      0
  );
}

const findAvailableSubject = (subject, availableSubjects = []) => {
  if (!subject || !Array.isArray(availableSubjects)) {
    return null;
  }
  const registrationId =
    subject.moduleRegistrationID ??
    subject.module_registration_id;

  const offeredModuleId =
    subject.offeredModuleID ??
    subject.offered_module_id;

  return availableSubjects.find((item) => {
    const registrationMatch =
      registrationId != null &&
      item.moduleRegistrationID != null &&
      String(item.moduleRegistrationID) === String(registrationId);

    const offeredModuleMatch =
      offeredModuleId != null &&
      item.offeredModuleID != null &&
      String(item.offeredModuleID) === String(offeredModuleId);

    return registrationMatch || offeredModuleMatch;
  }) || null;
};


function getSubjectCode(subject, availableSubjects = []) {
  const matchedSubject = findAvailableSubject(subject, availableSubjects);
  
  return (
    matchedSubject?.moduleCode ||
    matchedSubject?.module_code ||
    subject?.moduleCode ||
    subject?.module_code ||
    subject?.mod_code ||
    subject?.course_code ||
    subject?.offered_module_code ||
    "Subject"
  );
}


function getSubjectName(subject, availableSubjects = []) {
  const matchedSubject = findAvailableSubject(subject, availableSubjects);

  return (
    matchedSubject?.mod_name ||
    matchedSubject?.module_title ||
    matchedSubject?.module_name ||
    matchedSubject?.course_title ||
    subject?.mod_name ||
    subject?.module_title ||
    subject?.module_name ||
    subject?.course_title ||
    subject?.offered_module_name ||
    "Untitled subject"
  );
}


function getSubjectCredits(subject) {
  return Number(
    subject?.credit_hours ??
      subject?.mod_creditHour ??
      subject?.mod_credit_hour ??
      subject?.module_credit_hours ??
      subject?.apd_credit_hours ??
      0
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

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

function getTermLabel(value) {
  const term = Number(value);

  if (term === 1) return "Spring";
  if (term === 2) return "Summer";
  if (term === 3) return "Autumn";

  return "Current";
}

function getApplicationDetails(application) {
  return Array.isArray(application?.details)
    ? application.details
    : [];
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

function AlertMessage({
  message,
  type = "error",
  onClose,
}) {
  if (!message) return null;

  return (
    <div className={`sr-alert sr-alert-${type}`} role="alert">
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
  year,
}) {
  const user = userProp || {};

  const role = getRole(user);

  const isRegistrar = [
    "registrar",
    "admin",
    "super-admin",
  ].includes(role);

  const studentId =
    student_id ||
    user?.student_id ||
    user?.studentID ||
    user?.studentId ||
    "";

  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

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

  const [applicationForm, setApplicationForm] = useState({
    ...EMPTY_APPLICATION,
    term: term ?? "",
    year: year ?? "",
  });

  const [reviewAction, setReviewAction] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Derived Application Data                                                 */
  /* ------------------------------------------------------------------------ */

  const registrationType = getRegistrationType(selectedApplication);

  const isRegularRegistration = isRegularType(registrationType);

  const isSupplementaryRegistration =
    isSupplementaryType(registrationType);

  const selectedDetails = getApplicationDetails(selectedApplication);

  const selectedSubjectCount = selectedDetails.length;

  const totalCredits = getTotalCredits(selectedDetails);

  const remainingSubjectSlots = isRegularRegistration
    ? null
    : Math.max(0, MAX_NON_REGULAR_SUBJECTS - selectedSubjectCount);

  const isEditable = selectedApplication
    ? ["DRAFT", "CHANGES_REQUESTED"].includes(
        getApplicationStatus(selectedApplication)
      )
    : false;

  /* ------------------------------------------------------------------------ */
  /* Selected Subject IDs                                                     */
  /* ------------------------------------------------------------------------ */

  const selectedSubjectIds = useMemo(() => {
    return new Set(
      selectedDetails
        .map((detail) =>
          getSubjectIdForType(detail, registrationType)
        )
        .filter(
          (id) =>
            id !== null &&
            id !== undefined &&
            String(id).trim() !== ""
        )
        .map((id) => String(id))
    );
  }, [selectedDetails, registrationType]);

  /* ------------------------------------------------------------------------ */
  /* Load Initial Data                                                        */
  /* ------------------------------------------------------------------------ */

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (isRegistrar) {
        const queue = await fetchReviewQueue();

        setReviewQueue(Array.isArray(queue) ? queue : []);
        return;
      }

      if (!studentId || !token) {
        setApplications([]);
        setError(
          "Student information or authentication token is missing."
        );
        return;
      }

      const applicationData = await fetchMyApplications(
        studentId,
        token
      );

      const applicationsList = Array.isArray(applicationData)
        ? applicationData
        : applicationData?.applications || [];

      setApplications(applicationsList);

      setApplicationForm({
        reg_type: 1,
        term: term ?? "",
        year: year ?? "",
        student_remarks: "",
      });
    } catch (err) {
      console.error(
        "Failed to load registration applications:",
        err
      );

      setError(getErrorMessage(err));
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [isRegistrar, studentId, token, term, year]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  /* ------------------------------------------------------------------------ */
  /* Load Available Subjects                                                  */
  /* ------------------------------------------------------------------------ */

  
const loadAvailableSubjects = useCallback(async () => {
  if (!selectedApplication) {
    setAvailableSubjects([]);
    return;
  }

  try {
    setDetailLoading(true);
    setError("");

    const regType = getRegistrationType(selectedApplication);

    const applicationTerm = Number(
      selectedApplication.apl_term ??
        selectedApplication.term
    );

    const applicationYear = Number(
      selectedApplication.apl_year ??
        selectedApplication.year
    );

    if (
      !Number.isInteger(regType) ||
      !Number.isInteger(applicationTerm) ||
      !Number.isInteger(applicationYear)
    ) {
      throw new Error(
        "Invalid registration type, academic term, or academic year."
      );
    }

    const response = await fetchAvailableSubjects(
      regType,
      applicationTerm,
      applicationYear
    );

    // Handle different API response structures.
    let subjects = [];

    if (Array.isArray(response)) {
      subjects = response;
    } else if (Array.isArray(response?.data)) {
      subjects = response.data;
    } else if (Array.isArray(response?.subjects)) {
      subjects = response.subjects;
    } else if (Array.isArray(response?.items)) {
      subjects = response.items;
    } else if (Array.isArray(response?.data?.subjects)) {
      subjects = response.data.subjects;
    }

   // console.log("Available subjects response:", response);
   // console.log("Available subjects:", subjects);

    setAvailableSubjects(subjects);
  } catch (err) {
    console.error("Unable to load available subjects:", err);

    setAvailableSubjects([]);

    setError(
      `Unable to load available subjects: ${getErrorMessage(err)}`
    );
  } finally {
    setDetailLoading(false);
  }
}, [selectedApplication]);

  useEffect(() => {
    if (
      !isRegistrar &&
      activeTab === "subjects" &&
      selectedApplication
    ) {
      loadAvailableSubjects();
    }
  },   
  [
    activeTab,
    selectedApplication,
    isRegistrar,
    loadAvailableSubjects,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Application Selection                                                    */
  /* ------------------------------------------------------------------------ */

  const openApplication = async (
    applicationId,
    tab = "subjects"
  ) => {
    try {
      setDetailLoading(true);
      setError("");
      setSuccess("");

      const application = await fetchApplication(applicationId);

      setSelectedApplication(application);
      setRemarks(application?.apl_student_remarks || "");
      setAvailableSubjects([]);
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

    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const registrationType = Number(applicationForm.reg_type);
      const applicationTerm = Number(applicationForm.term);
      const applicationYear = Number(applicationForm.year);

      if (
        !Number.isInteger(registrationType) ||
        registrationType < 1
      ) {
        setError("Please select a valid registration type.");
        return;
      }

      if (
        !Number.isInteger(applicationTerm) ||
        applicationTerm < 1
      ) {
        setError("A valid academic term is required.");
        return;
      }

      if (
        !Number.isInteger(applicationYear) ||
        applicationYear < 2000
      ) {
        setError("A valid academic year is required.");
        return;
      }

      const payload = {
        term: applicationTerm,
        year: applicationYear,
        student_remarks:
          applicationForm.student_remarks?.trim() || null,
        application_type: registrationType,
      };

      const created = await createApplication(payload);

      const applicationId = getApplicationId(created);

      setShowCreateModal(false);

      setApplicationForm({
        reg_type: 1,
        term: term ?? "",
        year: year ?? "",
        student_remarks: "",
      });

      setSuccess(
        "Registration application created successfully."
      );

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
    if (!selectedApplication || !isEditable || saving) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updated = await updateApplication(
        selectedApplication.application_id,
        {
          student_remarks: remarks.trim() || null,
        }
      );

      const refreshed =
        updated?.application_id
          ? updated
          : await fetchApplication(
              selectedApplication.application_id
            );

      setSelectedApplication(refreshed);

      setSuccess(
        "Application remarks updated successfully."
      );

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
    if (!selectedApplication || saving || !isEditable) {
      return;
    }

    const applicationType = getRegistrationType(
      selectedApplication
    );

    if (!applicationType) {
      setError("Unable to determine the registration type.");
      return;
    }

    const isSupplementary = isSupplementaryType(applicationType);
    const isRegular = isRegularType(applicationType);

    // Non-Regular applications can contain at most two subjects.
    if (
      !isRegular &&
      selectedDetails.length >= MAX_NON_REGULAR_SUBJECTS
    ) {
      setError(
        `You can select a maximum of ${MAX_NON_REGULAR_SUBJECTS} subjects for this registration type.`
      );
      return;
    }

    const subjectId = getSubjectIdForType(
      subject,
      applicationType
    );

    if (
      subjectId === null ||
      subjectId === undefined ||
      !Number.isInteger(Number(subjectId)) ||
      Number(subjectId) <= 0
    ) {
      setError(
        isSupplementary
          ? "This supplementary subject does not have a valid module registration ID."
          : "This subject does not have a valid offered module ID."
      );
      return;
    }

    // Check duplicate using the ID relevant to this registration type.
    const alreadyAdded = selectedDetails.some((detail) => {
      const existingId = getSubjectIdForType(
        detail,
        applicationType
      );

      return (
        existingId !== null &&
        existingId !== undefined &&
        String(existingId) === String(subjectId)
      );
    });

    if (alreadyAdded) {
      setError("This subject has already been added.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        offeredModuleID: isSupplementary
          ? null
          : Number(subjectId),

        moduleRegistrationID: isSupplementary
          ? Number(subjectId)
          : null,

        // Credit hours are calculated by the backend.
        remarks: null,
        status: subject?.status ?? null,
      };

      console.log("Adding registration subject:", {
        applicationType,
        subjectId,
        payload,
      });

      await addApplicationSubject(
        selectedApplication.application_id,
        payload
      );

      const refreshed = await fetchApplication(
        selectedApplication.application_id
      );

      setSelectedApplication(refreshed);

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
    console.log(detail);
    if (
      !selectedApplication ||
      !detail?.application_detail_id ||
      saving ||
      !isEditable
    ) {
      return;
    }

    if (
      !window.confirm(
        "Remove this subject from your application?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

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
  /* Validate and Submit Application                                          */
  /* ------------------------------------------------------------------------ */

  const validateApplicationBeforeSubmit = () => {
    if (!selectedApplication) {
      return "No application is selected.";
    }

    const details = getApplicationDetails(selectedApplication);
    const type = getRegistrationType(selectedApplication);

    if (!type) {
      return "Unable to determine the registration type.";
    }

    if (details.length === 0) {
      return "Please add at least one subject before submitting.";
    }

    // Every non-Regular registration is limited to two subjects.
    if (
      !isRegularType(type) &&
      details.length > MAX_NON_REGULAR_SUBJECTS
    ) {
      return `This registration type allows a maximum of ${MAX_NON_REGULAR_SUBJECTS} subjects.`;
    }

    // Regular registration requires every available course.
    if (isRegularType(type)) {
      if (!Array.isArray(availableSubjects) || availableSubjects.length === 0) {
        return (
          "Unable to verify the mandatory courses. " +
          "Please reload the available subjects before submitting."
        );
      }

      const availableIds = availableSubjects
        .map((subject) =>
          getSubjectIdForType(subject, type)
        )
        .filter(
          (id) =>
            id !== null &&
            id !== undefined &&
            String(id).trim() !== ""
        )
        .map((id) => String(id));

      if (availableIds.length !== availableSubjects.length) {
        return (
          "Some available courses do not have valid offered module IDs. " +
          "Please contact the department."
        );
      }

      const selectedIds = new Set(
        details
          .map((detail) =>
            getSubjectIdForType(detail, type)
          )
          .filter(
            (id) =>
              id !== null &&
              id !== undefined &&
              String(id).trim() !== ""
          )
          .map((id) => String(id))
      );

      const missingSubjects = availableSubjects.filter(
        (subject) => {
          const id = getSubjectIdForType(subject, type);

          return (
            id === null ||
            id === undefined ||
            !selectedIds.has(String(id))
          );
        }
      );

      if (missingSubjects.length > 0) {
        const missingCodes = missingSubjects
          .slice(0, 5)
          .map((subject) => getSubjectCode(subject, availableSubjects))
          .join(", ");

        const remaining =
          missingSubjects.length > 5
            ? ` and ${missingSubjects.length - 5} more`
            : "";

        return (
          `Regular registration requires all available courses. ` +
          `You still need to add ${missingSubjects.length} course(s): ` +
          `${missingCodes}${remaining}.`
        );
      }
    }

    return "";
  };

  const handleSubmitApplication = async () => {
    if (!selectedApplication || saving) return;

    setError("");
    setSuccess("");

    const validationError =
      validateApplicationBeforeSubmit();

    if (validationError) {
      setError(validationError);
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to submit this registration application? You may not be able to edit it after submission."
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      await submitApplication(
        selectedApplication.application_id
      );

      const refreshed = await fetchApplication(
        selectedApplication.application_id
      );

      setSelectedApplication(refreshed);

      setSuccess(
        "Your registration application has been submitted."
      );

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

    if (!selectedApplication || saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

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
      setSuccess("");

      setSelectedApplication(application);

      const data = await fetchApplicationHistory(
        application.application_id
      );

      setHistory(Array.isArray(data) ? data : []);
      setActiveTab("history");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Registrar Review Queue                                                   */
  /* ------------------------------------------------------------------------ */

  const refreshReviewQueue = async () => {
    try {
      setLoading(true);
      setError("");

      const queue = await fetchReviewQueue();

      setReviewQueue(Array.isArray(queue) ? queue : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Registrar Review Actions                                                 */
  /* ------------------------------------------------------------------------ */

  const handleReviewAction = async (event) => {
    event.preventDefault();

    if (
      !selectedApplication ||
      !reviewAction ||
      saving
    ) {
      return;
    }

    const applicationId = selectedApplication.application_id;
    const reviewText = reviewRemarks.trim();

    if (reviewAction === "changes" && !reviewText) {
      setError("Please enter the changes required.");
      return;
    }

    if (reviewAction === "reject" && !reviewText) {
      setError("Please provide a reason for rejection.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (reviewAction === "start") {
        await startApplicationReview(applicationId, {
          remarks: reviewText || null,
        });
      } else if (reviewAction === "changes") {
        await requestApplicationChanges(
          applicationId,
          reviewText
        );
      } else if (reviewAction === "approve") {
        await approveApplication(
          applicationId,
          reviewText
        );
      } else if (reviewAction === "reject") {
        await rejectApplication(
          applicationId,
          reviewText
        );
      }

      setShowReviewModal(false);
      setReviewRemarks("");
      setReviewAction("");

      setSuccess(
        "Application review action completed successfully."
      );

      await refreshReviewQueue();

      // Refresh the currently opened application after review.
      const refreshed = await fetchApplication(applicationId);
      setSelectedApplication(refreshed);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Search and Calculations                                                   */
  /* ------------------------------------------------------------------------ */

  const filteredSubjects = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return availableSubjects;
    }

    return availableSubjects.filter((subject) => {
      const subjectId = getSubjectIdForType(
        subject,
        registrationType
      );

      const searchableValues = [
        getSubjectCode(subject, availableSubjects),
        getSubjectName(subject, availableSubjects),
        subject?.moduleCode,
        subject?.mod_name,
        subject?.mod_group,
        subject?.mod_type,
        subject?.letterGrade,
        subject?.moduleRegistrationID,
        subject?.offeredModuleID,
        subjectId,
      ];

      return searchableValues.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(searchText)
      );
    });
  }, [availableSubjects, search, registrationType]);

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
          onClick={
            isRegistrar
              ? refreshReviewQueue
              : loadInitialData
          }
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
      {/* Navigation                                                          */}
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
            <span className="sr-tab-count">
              {reviewQueue.length}
            </span>
          </button>
        </div>
      ) : (
        <div className="sr-tabs">
          <button
            type="button"
            className={
              activeTab === "dashboard" ? "active" : ""
            }
            onClick={() => setActiveTab("dashboard")}
          >
            <FileText size={17} />
            My Applications
          </button>

          {selectedApplication && (
            <>
              <button
                type="button"
                className={
                  activeTab === "subjects" ? "active" : ""
                }
                onClick={() => setActiveTab("subjects")}
              >
                <BookOpen size={17} />
                Subject Selection
              </button>

              <button
                type="button"
                className={
                  activeTab === "history" ? "active" : ""
                }
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
                    {getTermLabel(term)} {year || "—"}
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
                    View, continue, and track your subject
                    registration applications.
                  </p>
                </div>

                <button
                  type="button"
                  className="sr-primary-button"
                  onClick={() => {
                    setApplicationForm({
                      reg_type: 1,
                      term: term ?? "",
                      year: year ?? "",
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
                      onClick={() => {
                        setApplicationForm({
                          reg_type: 1,
                          term: term ?? "",
                          year: year ?? "",
                          student_remarks: "",
                        });
                        setShowCreateModal(true);
                      }}
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

                            <td>
                              {getRegistrationTypeLabel(
                                getRegistrationType(application)
                              )}
                            </td>

                            <td>
                              {getTermLabel(application.apl_term)},{" "}
                              {application.apl_year}
                            </td>

                            <td>
                              {Number(
                                application.apl_total_credit_hours || 0
                              ).toFixed(2)}
                            </td>

                            <td>
                              {formatDate(
                                application.apl_submitted_at
                              )}
                            </td>

                            <td>
                              <StatusBadge
                                status={getApplicationStatus(
                                  application
                                )}
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
                                  onClick={() =>
                                    openHistory(application)
                                  }
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

          {!isRegistrar &&
            activeTab === "subjects" &&
            selectedApplication && (              
                  <RegistrationApplicationDetail
                    selectedApplication={selectedApplication}

                    // IMPORTANT: Pass the complete, unfiltered list.
                    availableSubjects={availableSubjects}

                    // Search-filtered list for display.
                    filteredSubjects={filteredSubjects}

                    selectedDetails={selectedDetails}
                    selectedSubjectIds={selectedSubjectIds}
                    totalCredits={totalCredits}

                    isEditable={isEditable}
                    saving={saving}

                    search={search}
                    setSearch={setSearch}

                    remarks={remarks}
                    setRemarks={setRemarks}

                    onBack={() => setActiveTab("dashboard")}
                    onAddSubject={handleAddSubject}
                    onRemoveSubject={handleRemoveSubject}
                    onSaveRemarks={handleSaveRemarks}
                    onSubmitApplication={handleSubmitApplication}
                    onCancelApplication={() => setShowCancelModal(true)}

                    getRegistrationTypeLabel={getRegistrationTypeLabel}
                    getApplicationStatus={getApplicationStatus}

                    isRegularRegistration={isRegularRegistration}
                    isSupplementaryRegistration={isSupplementaryRegistration}

                    maxSubjects={
                      isRegularRegistration
                        ? null
                        : MAX_NON_REGULAR_SUBJECTS
                    }

                    remainingSubjectSlots={remainingSubjectSlots}

                    mandatorySubjectCount={
                      isRegularRegistration
                        ? availableSubjects.length
                        : 0
                    }
                    
                    detailLoading={detailLoading}
                  />

            )}

          {/* ============================================================ */}
          {/* APPLICATION HISTORY                                         */}
          {/* ============================================================ */}

          {!isRegistrar &&
            activeTab === "history" &&
            selectedApplication && (
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
                    status={getApplicationStatus(
                      selectedApplication
                    )}
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
                                  .replace(/_/g, " ")}
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

                            <td>
                              {getRegistrationTypeLabel(
                                getRegistrationType(application)
                              )}
                            </td>

                            <td>
                              {getTermLabel(application.apl_term)},{" "}
                              {application.apl_year}
                            </td>

                            <td>
                              {Number(
                                application.apl_total_credit_hours || 0
                              ).toFixed(2)}
                            </td>

                            <td>
                              {formatDate(
                                application.apl_submitted_at
                              )}
                            </td>

                            <td>
                              <StatusBadge
                                status={getApplicationStatus(
                                  application
                                )}
                              />
                            </td>

                            <td>
                              <button
                                type="button"
                                className="sr-primary-button sr-small-button"
                                onClick={() =>
                                  openApplication(
                                    application.application_id,
                                    "review"
                                  )
                                }
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
            </>
          )}

          {/* ============================================================ */}
          {/* REGISTRAR REVIEW DETAIL                                     */}
          {/* ============================================================ */}

          {isRegistrar &&
            activeTab === "review" &&
            selectedApplication && (
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
                    status={getApplicationStatus(
                      selectedApplication
                    )}
                  />
                </div>

                <div className="sr-application-banner">
                  <div>
                    <span>Application</span>
                    <h2>
                      {selectedApplication.application_no}
                    </h2>
                    <p>
                      Student ID: {selectedApplication.studentID}
                    </p>
                    <p>
                      <strong>
                        {getRegistrationTypeLabel(
                          getRegistrationType(selectedApplication)
                        )}
                      </strong>
                    </p>
                  </div>

                  <div className="sr-application-banner-stat">
                    <span>Term / Year</span>
                    <strong>
                      {getTermLabel(
                        selectedApplication.apl_term
                      )},{" "}
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
                      <p>
                        Subjects submitted by the student.
                      </p>
                    </div>
                  </div>

                  <div className="sr-table-wrapper">
                    <table className="sr-table">
                      <thead>
                        <tr>
                          <th>Module Registration / Offered Module ID</th>
                          <th>Subject</th>
                          <th>Credit Hours</th>
                        </tr>
                      </thead>

                      <tbody>
                        {getApplicationDetails(
                          selectedApplication
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={3}>
                              No subjects found.
                            </td>
                          </tr>
                        ) : (
                          getApplicationDetails(
                            selectedApplication
                          ).map((detail) => {
                            const detailId =
                              detail.moduleRegistrationID ??
                              detail.module_registration_id ??
                              detail.offeredModuleID ??
                              detail.offered_module_id ??
                              "—";

                            return (
                              <tr
                                key={detail.application_detail_id}
                              >
                                <td>{detailId}</td>

                                <td>
                                  {detail.module_code ||
                                    detail.moduleCode ||
                                    "—"}
                                  {detail.module_title ||
                                  detail.mod_name
                                    ? ` — ${
                                        detail.module_title ||
                                        detail.mod_name
                                      }`
                                    : ""}
                                </td>

                                <td>
                                  {getCreditHours(detail).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
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
                        setReviewRemarks("");
                        setShowReviewModal(true);
                      }}
                      disabled={
                        getApplicationStatus(
                          selectedApplication
                        ) !== "SUBMITTED"
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
                        setReviewRemarks("");
                        setShowReviewModal(true);
                      }}
                      disabled={
                        ![
                          "SUBMITTED",
                          "UNDER_REVIEW",
                        ].includes(
                          getApplicationStatus(
                            selectedApplication
                          )
                        )
                      }
                    >
                      <AlertCircle size={17} />
                      Request Changes
                    </button>

                    <button
                      type="button"
                      className="sr-approve-button"
                      onClick={() => {
                        setReviewAction("approve");
                        setReviewRemarks("");
                        setShowReviewModal(true);
                      }}
                      disabled={
                        ![
                          "SUBMITTED",
                          "UNDER_REVIEW",
                        ].includes(
                          getApplicationStatus(
                            selectedApplication
                          )
                        )
                      }
                    >
                      <CheckCircle2 size={17} />
                      Approve
                    </button>

                    <button
                      type="button"
                      className="sr-reject-button"
                      onClick={() => {
                        setReviewAction("reject");
                        setReviewRemarks("");
                        setShowReviewModal(true);
                      }}
                      disabled={
                        ![
                          "SUBMITTED",
                          "UNDER_REVIEW",
                        ].includes(
                          getApplicationStatus(
                            selectedApplication
                          )
                        )
                      }
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

      {/* ================================================================ */}
      {/* CREATE APPLICATION MODAL                                         */}
      {/* ================================================================ */}

      {showCreateModal && (
        <div
          className="sr-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowCreateModal(false);
            }
          }}
        >
          <div className="sr-modal">
            <div className="sr-modal-header">
              <div>
                <h2>Create Registration Application</h2>
                <p>
                  Create a Regular, Supplementary, Retake,
                  Improvement, or Special-Supplementary
                  application from one place.
                </p>
              </div>

              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setShowCreateModal(false)}
                disabled={saving}
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
                  value={applicationForm.reg_type}
                  onChange={(event) => {
                    setApplicationForm((previous) => ({
                      ...previous,
                      reg_type: Number(event.target.value),
                    }));
                  }}
                  required
                  disabled={saving}
                >
                  {REGISTRATION_TYPES.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>

                <small>
                  Select the registration category for this
                  application.
                </small>
              </div>

              <div className="sr-form-grid">
                <div className="sr-form-field">
                  <label>Academic Term</label>
                  <h1>
                    {getTermLabel(applicationForm.term)}
                  </h1>
                </div>

                <div className="sr-form-field">
                  <label>Academic Year</label>
                  <h1>{applicationForm.year || "—"}</h1>
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
                  disabled={saving}
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
                    <Loader2
                      size={17}
                      className="sr-spin"
                    />
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
        <div
          className="sr-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowCancelModal(false);
            }
          }}
        >
          <div className="sr-modal">
            <div className="sr-modal-header">
              <div>
                <h2>Cancel Application</h2>
                <p>
                  Please provide a reason for cancelling this
                  application.
                </p>
              </div>

              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setShowCancelModal(false)}
                disabled={saving}
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
                  disabled={saving}
                />
              </div>

              <div className="sr-modal-actions">
                <button
                  type="button"
                  className="sr-secondary-button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={saving}
                >
                  Keep Application
                </button>

                <button
                  type="submit"
                  className="sr-reject-button"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="sr-spin"
                    />
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
        <div
          className="sr-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowReviewModal(false);
            }
          }}
        >
          <div className="sr-modal">
            <div className="sr-modal-header">
              <div>
                <h2>
                  {reviewAction === "start" &&
                    "Start Application Review"}

                  {reviewAction === "changes" &&
                    "Request Changes"}

                  {reviewAction === "approve" &&
                    "Approve Application"}

                  {reviewAction === "reject" &&
                    "Reject Application"}
                </h2>

                <p>
                  Application:{" "}
                  {selectedApplication?.application_no}
                </p>
              </div>

              <button
                type="button"
                className="sr-modal-close"
                onClick={() => setShowReviewModal(false)}
                disabled={saving}
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
                  disabled={saving}
                />
              </div>

              <div className="sr-modal-actions">
                <button
                  type="button"
                  className="sr-secondary-button"
                  onClick={() => setShowReviewModal(false)}
                  disabled={saving}
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
                    <Loader2
                      size={17}
                      className="sr-spin"
                    />
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
