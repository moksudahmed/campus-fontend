
import React from "react";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import "../styles/SubjectRegistration.css";

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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getStatusLabel(status) {
  return STATUS_LABELS[status] || status || "Unknown";
}

function getStatusClass(status) {
  return STATUS_CLASSES[status] || "draft";
}

function getRegistrationType(application) {
  const value =
    application?.apl_application_type ??
    application?.application_type ??
    application?.regi_type ??
    application?.reg_type ??
    application?.apl_reg_type ??
    application?.registration_type;

  const number = Number(value);

  return Number.isInteger(number) && number > 0
    ? number
    : null;
}

function getSubjectId(subject, isSupplementary) {
  if (isSupplementary) {
    return (
      subject?.moduleRegistrationID ??
      subject?.module_registration_id ??
      subject?.moduleRegistrationId ??
      null
    );
  }

  return (
    subject?.offeredModuleID ??
    subject?.offered_module_id ??
    subject?.offeredModuleId ??
    null
  );
}

function normalizeId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) && number > 0
    ? String(number)
    : null;
}
function findAvailableSubject(
  subject,
  availableSubjects = [],
  isSupplementary = false
) {
  if (!subject || !Array.isArray(availableSubjects)) {
    return null;
  }

  const subjectId = normalizeId(
    getSubjectId(subject, isSupplementary)
  );

  if (!subjectId) return null;

  return (
    availableSubjects.find((item) => {
      const availableId = normalizeId(
        getSubjectId(item, isSupplementary)
      );

      return availableId === subjectId;
    }) || null
  );
}

function getSubjectCode(
  subject,
  availableSubjects = [],
  isSupplementary = false
) {
  const matchedSubject = findAvailableSubject(
    subject,
    availableSubjects,
    isSupplementary
  );

  return (
    subject?.moduleCode ??
    subject?.module_code ??
    subject?.mod_code ??
    subject?.course_code ??
    subject?.offered_module_code ??
    subject?.module_code_name ??
    matchedSubject?.moduleCode ??
    matchedSubject?.module_code ??
    matchedSubject?.mod_code ??
    matchedSubject?.course_code ??
    matchedSubject?.offered_module_code ??
    matchedSubject?.module_code_name ??
    "Code not available"
  );
}

function getSubjectName(
  subject,
  availableSubjects = [],
  isSupplementary = false
) {
  const matchedSubject = findAvailableSubject(
    subject,
    availableSubjects,
    isSupplementary
  );

  return (
    subject?.mod_name ??
    subject?.module_title ??
    subject?.module_name ??
    subject?.course_title ??
    subject?.offered_module_name ??
    subject?.moduleName ??
    matchedSubject?.mod_name ??
    matchedSubject?.module_title ??
    matchedSubject?.module_name ??
    matchedSubject?.course_title ??
    matchedSubject?.offered_module_name ??
    matchedSubject?.moduleName ??
    "Subject name not available"
  );
}

function getCreditHours(subject) {
  return Number(
    subject?.apd_credit_hours ??
      subject?.mod_creditHour ??
      subject?.mod_credit_hour ??
      subject?.credit_hours ??
      subject?.module_credit_hours ??
      0
  );
}

function getSubjectStatus(subject) {
  return (
    subject?.status ??
    subject?.subject_status ??
    subject?.apd_reg_status ??
    null
  );
}

function getSubjectStatusLabel(status) {
  if (!status) return "N/A";

  const labels = {
    AVAILABLE: "Available",
    REGULAR: "Regular",
    SUPPLEMENTARY: "Supplementary",
    RETAKE: "Retake",
    IMPROVEMENT: "Improvement",
    SPECIAL_SUPPLEMENTARY: "Special Supplementary",
    "F*(R)": "Failed - Retake",
    "F*(S)": "Failed - Supplementary",
  };

  return labels[status] || status;
}

function getSubjectStatusClass(status) {
  const normalized = String(status || "").toUpperCase();

  if (
    ["AVAILABLE", "REGULAR", "APPROVED"].includes(normalized)
  ) {
    return "success";
  }

  if (
    ["F*(R)", "F*(S)", "REJECTED"].includes(normalized)
  ) {
    return "danger";
  }

  if (
    [
      "SUPPLEMENTARY",
      "RETAKE",
      "IMPROVEMENT",
      "SPECIAL_SUPPLEMENTARY",
    ].includes(normalized)
  ) {
    return "info";
  }

  return "default";
}

/* -------------------------------------------------------------------------- */
/* Reusable Components                                                        */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }) {
  return (
    <span
      className={`sr-status sr-status-${getStatusClass(status)}`}
    >
      <span className="sr-status-dot" />
      {getStatusLabel(status)}
    </span>
  );
}

function SubjectStatusBadge({ status }) {
  if (!status) return null;

  return (
    <span
      className={`sr-subject-status sr-subject-status-${getSubjectStatusClass(
        status
      )}`}
    >
      {getSubjectStatusLabel(status)}
    </span>
  );
}

function AlertMessage({ message, type = "error" }) {
  if (!message) return null;

  return (
    <div className={`sr-alert sr-alert-${type}`} role="alert">
      {type === "success" ? (
        <CheckCircle2 size={19} />
      ) : (
        <AlertCircle size={19} />
      )}

      <span>{message}</span>
    </div>
  );
}

function EmptyState({
  icon: Icon = BookOpen,
  title,
  description,
}) {
  return (
    <div className="sr-empty">
      <div className="sr-empty-icon">
        <Icon size={28} />
      </div>

      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export default function RegistrationApplicationDetail({
  selectedApplication,

  // Complete unfiltered API result.
  availableSubjects = [],

  // Search-filtered subjects for display.
  filteredSubjects = [],

  selectedDetails = [],
  selectedSubjectIds = new Set(),
  totalCredits = 0,

  isEditable = false,
  saving = false,
  detailLoading = false,

  search = "",
  setSearch,

  remarks = "",
  setRemarks,

  onBack,
  onAddSubject,
  onRemoveSubject,
  onSaveRemarks,
  onSubmitApplication,
  onCancelApplication,

  getRegistrationTypeLabel,
  getApplicationStatus,

  isRegularRegistration: regularProp,
  isSupplementaryRegistration: supplementaryProp,

  maxSubjects = MAX_NON_REGULAR_SUBJECTS,
  remainingSubjectSlots,
  mandatorySubjectCount,
}) {
  if (!selectedApplication) return null;

  /* ------------------------------------------------------------------------ */
  /* Application Information                                                 */
  /* ------------------------------------------------------------------------ */

  const registrationType = getRegistrationType(
    selectedApplication
  );

  const isRegularRegistration =
    regularProp !== undefined
      ? regularProp
      : registrationType === 1;

  const isSupplementaryRegistration =
    supplementaryProp !== undefined
      ? supplementaryProp
      : registrationType === 3;

  const applicationStatus = getApplicationStatus
    ? getApplicationStatus(selectedApplication)
    : selectedApplication.apl_application_status || "DRAFT";

  const term = Number(
    selectedApplication.apl_term ??
      selectedApplication.term
  );

  const year =
    selectedApplication.apl_year ??
    selectedApplication.year;

  const termName =
    {
      1: "Spring",
      2: "Summer",
      3: "Autumn",
    }[term] || "Current";

  const subjectLimit =
    maxSubjects ?? MAX_NON_REGULAR_SUBJECTS;

  const selectedSubjectCount = selectedDetails.length;

  const availableSubjectCount = availableSubjects.length;

  /* ------------------------------------------------------------------------ */
  /* Normalize Subject Lists                                                  */
  /* ------------------------------------------------------------------------ */

  const allAvailableSubjects = Array.isArray(availableSubjects)
    ? availableSubjects
    : [];

  const visibleSubjects = Array.isArray(filteredSubjects)
    ? filteredSubjects
    : [];

  /* ------------------------------------------------------------------------ */
  /* Selected Subject IDs                                                     */
  /* ------------------------------------------------------------------------ */

  const availableSubjectIds = allAvailableSubjects
    .map((subject) =>
      normalizeId(
        getSubjectId(subject, isSupplementaryRegistration)
      )
    )
    .filter(Boolean);

  const selectedDetailIds = selectedDetails
    .map((detail) =>
      normalizeId(
        getSubjectId(detail, isSupplementaryRegistration)
      )
    )
    .filter(Boolean);

  const selectedIdsSet = new Set(selectedDetailIds);

  /* ------------------------------------------------------------------------ */
  /* Regular Registration Validation                                          */
  /* ------------------------------------------------------------------------ */

  // All available subjects must have valid IDs.
  const allAvailableIdsAreValid =
    availableSubjectCount > 0 &&
    availableSubjectIds.length === availableSubjectCount;

  // Remove duplicate IDs from the available list for comparison.
  const uniqueAvailableSubjectIds = [
    ...new Set(availableSubjectIds),
  ];

  // Every available subject must exist in the selected details.
  const missingSubjectIds = uniqueAvailableSubjectIds.filter(
    (id) => !selectedIdsSet.has(id)
  );

  const regularSubjectsComplete =
    allAvailableIdsAreValid &&
    missingSubjectIds.length === 0;

  /* ------------------------------------------------------------------------ */
  /* Non-Regular Registration Validation                                      */
  /* ------------------------------------------------------------------------ */

  const hasReachedSubjectLimit =
    !isRegularRegistration &&
    selectedSubjectCount >= subjectLimit;

  const nonRegularSubjectsValid =
    selectedSubjectCount > 0 &&
    selectedSubjectCount <= subjectLimit;

  /* ------------------------------------------------------------------------ */
  /* Submission Validation                                                    */
  /* ------------------------------------------------------------------------ */

  const canSubmitApplication =
    isEditable &&
    !detailLoading &&
    (
      isRegularRegistration
        ? regularSubjectsComplete
        : nonRegularSubjectsValid
    );

  const validationMessage = (() => {
    if (detailLoading) {
      return "Loading available subjects. Please wait.";
    }

    if (isRegularRegistration) {
      if (availableSubjectCount === 0) {
        return "Unable to verify available subjects. Please reload the subject list.";
      }

      if (!allAvailableIdsAreValid) {
        return "Some available subjects have missing or invalid offered module IDs.";
      }

      if (missingSubjectIds.length > 0) {
        return `Please add all available subjects. ${selectedIdsSet.size} of ${uniqueAvailableSubjectIds.length} subjects selected.`;
      }

      return "";
    }

    if (selectedSubjectCount === 0) {
      return "Please select at least one subject.";
    }

    if (selectedSubjectCount > subjectLimit) {
      return `You cannot select more than ${subjectLimit} subjects.`;
    }

    return "";
  })();

  /* ------------------------------------------------------------------------ */
  /* Subject Selection                                                        */
  /* ------------------------------------------------------------------------ */

  const isSubjectAlreadyAdded = (subject) => {
    const id = normalizeId(
      getSubjectId(subject, isSupplementaryRegistration)
    );

    if (!id) return false;

    return selectedIdsSet.has(id);
  };

  const handleAddSubject = (subject) => {
    if (!isEditable || saving) return;

    if (
      !isRegularRegistration &&
      hasReachedSubjectLimit
    ) {
      return;
    }

    if (isSubjectAlreadyAdded(subject)) return;

    const subjectId = normalizeId(
      getSubjectId(subject, isSupplementaryRegistration)
    );

    if (!subjectId) {
      console.error("Invalid subject ID:", subject);
      return;
    }

    const payload = {
      ...subject,

      offeredModuleID: isSupplementaryRegistration
        ? null
        : Number(subjectId),

      moduleRegistrationID: isSupplementaryRegistration
        ? Number(subjectId)
        : null,
    };

    onAddSubject?.(payload);
  };

  /* ------------------------------------------------------------------------ */
  /* Submission                                                               */
  /* ------------------------------------------------------------------------ */

  const handleSubmitApplication = () => {
    if (!canSubmitApplication || saving) return;

    onSubmitApplication?.();
  };

  /* ------------------------------------------------------------------------ */
  /* Subject ID Label                                                         */
  /* ------------------------------------------------------------------------ */

  const subjectIdLabel = isSupplementaryRegistration
    ? "Module Registration ID"
    : "Offered Module ID";

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      {/* Back button and status */}

      <div className="sr-back-row">
        <button
          type="button"
          className="sr-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to Applications
        </button>

        <StatusBadge status={applicationStatus} />
      </div>

      {/* Application banner */}

      <div className="sr-application-banner">
        <div>
          <span>Registration Application</span>

          <h2>{selectedApplication.application_no}</h2>

          <p>
            <strong>
              {getRegistrationTypeLabel?.(registrationType) ||
                "Registration"}
            </strong>

            {" · "}

            {termName} {year}
          </p>

          {isSupplementaryRegistration && (
            <small>
              Subject identification: Module Registration ID
            </small>
          )}
        </div>

        <div className="sr-application-banner-stat">
          <span>Selected Credits</span>
          <strong>
            {Number(totalCredits || 0).toFixed(2)}
          </strong>
        </div>

        <div className="sr-application-banner-stat">
          <span>Selected Subjects</span>

          <strong>
            {selectedSubjectCount}
            {!isRegularRegistration && ` / ${subjectLimit}`}
          </strong>
        </div>
      </div>

      {/* Reviewer remarks */}

      {applicationStatus === "CHANGES_REQUESTED" && (
        <AlertMessage
          message={
            selectedApplication.apl_reviewer_remarks ||
            "The registrar has requested changes to your application."
          }
        />
      )}

      {/* Subject selection layout */}

      <div className="sr-selection-layout">
        {/* Available subjects */}

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
              {visibleSubjects.length} Subjects
            </span>
          </div>

          {/* Registration rule */}

          <div className="sr-selection-rule">
            {isRegularRegistration ? (
              <p>
                <ShieldCheck size={16} />

                <span>
                  <strong>Regular Registration:</strong>{" "}
                  All available subjects must be selected.
                  {" "}
                  ({selectedSubjectCount} of{" "}
                  {mandatorySubjectCount ?? availableSubjectCount} selected)
                </span>
              </p>
            ) : (
              <p>
                <ShieldCheck size={16} />

                <span>
                  <strong>Subject Selection Limit:</strong>{" "}
                  Maximum {subjectLimit} subjects per application.
                  {" "}
                  ({selectedSubjectCount}/{subjectLimit} selected)
                </span>
              </p>
            )}
          </div>

          {/* Search */}

          <div className="sr-search-box">
            <Search size={18} />

            <input
              type="search"
              placeholder="Search module code, subject name, group or type..."
              value={search}
              onChange={(event) =>
                setSearch?.(event.target.value)
              }
            />
          </div>

          {/* Subject list */}

          {detailLoading ? (
            <div className="sr-loading">
              <Loader2 className="sr-spin" size={24} />
              <span>Loading available subjects...</span>
            </div>
          ) : visibleSubjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No available subjects"
              description={
                availableSubjectCount === 0
                  ? "No subjects were returned for this registration application."
                  : "No matching subjects were found. Try another search."
              }
            />
          ) : (
            <div className="sr-subject-list">
              {visibleSubjects.map((subject, index) => {
                const subjectId = getSubjectId(
                  subject,
                  isSupplementaryRegistration
                );

                const isAdded = isSubjectAlreadyAdded(subject);

                const subjectStatus = getSubjectStatus(subject);

                const letterGrade =
                  subject?.letterGrade ??
                  subject?.letter_grade;

                const gradePoint =
                  subject?.gradePoint ??
                  subject?.grade_point;

                const isAddDisabled =
                  isAdded ||
                  saving ||
                  !isEditable ||
                  !normalizeId(subjectId) ||
                  (
                    !isRegularRegistration &&
                    hasReachedSubjectLimit
                  );

                return (
                  <div
                    className="sr-subject-item"
                    key={`${registrationType}-${subjectId ?? index}`}
                  >
                    <div className="sr-subject-info">
                      <div className="sr-subject-code">
                        {getSubjectCode(subject, allAvailableSubjects, isSupplementaryRegistration)}
                      </div>

                      <h3>{getSubjectName(subject, allAvailableSubjects, isSupplementaryRegistration)}</h3>

                      {subjectStatus && (
                        <div className="sr-subject-status-row">
                          <SubjectStatusBadge
                            status={subjectStatus}
                          />
                        </div>
                      )}

                      <div className="sr-subject-meta">
                        <span>
                          <strong>Credits:</strong>{" "}
                          {getCreditHours(subject).toFixed(2)}
                        </span>

                        <span>
                          <strong>Group:</strong>{" "}
                          {subject?.mod_group || "N/A"}
                        </span>

                        <span>
                          <strong>Type:</strong>{" "}
                          {subject?.mod_type || "N/A"}
                        </span>

                        {letterGrade && (
                          <span>
                            <strong>Previous Grade:</strong>{" "}
                            {letterGrade}
                          </span>
                        )}

                        {gradePoint != null && (
                          <span>
                            <strong>Grade Point:</strong>{" "}
                            {Number(gradePoint).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <small className="sr-offered-module-id">
                        {subjectIdLabel}: {subjectId ?? "N/A"}
                      </small>
                    </div>

                    <button
                      type="button"
                      className={
                        isAdded
                          ? "sr-added-button"
                          : "sr-add-button"
                      }
                      disabled={isAddDisabled}
                      title={
                        hasReachedSubjectLimit && !isAdded
                          ? `Maximum ${subjectLimit} subjects allowed.`
                          : undefined
                      }
                      onClick={() => handleAddSubject(subject)}
                    >
                      {isAdded ? (
                        <>
                          <Check size={16} />
                          Added
                        </>
                      ) : hasReachedSubjectLimit ? (
                        <>
                          <ShieldCheck size={16} />
                          Limit Reached
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

        {/* Selected subjects */}

        <aside className="sr-selected-panel">
          <div className="sr-panel-heading">
            <div>
              <h2>Selected Subjects</h2>
              <p>Your registration summary</p>
            </div>

            <span className="sr-selected-count">
              {selectedSubjectCount}
              {!isRegularRegistration && ` / ${subjectLimit}`}
            </span>
          </div>

          {selectedDetails.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects selected"
              description="Add subjects from the available subjects list."
            />
          ) : (
            <div className="sr-selected-list">
              {selectedDetails.map((detail, index) => {
                const subjectId = getSubjectId(
                  detail,
                  isSupplementaryRegistration
                );

                const subjectStatus = getSubjectStatus(detail);

                const letterGrade =
                  detail?.letterGrade ??
                  detail?.letter_grade;

                const gradePoint =
                  detail?.gradePoint ??
                  detail?.grade_point;

                return (
                  <div
                    className="sr-selected-item"
                    key={
                      detail.application_detail_id ??
                      subjectId ??
                      index
                    }
                  >
                    <div>
                      <strong>{getSubjectCode(detail, allAvailableSubjects, isSupplementaryRegistration)}</strong>

                      <span>{getSubjectName(detail, allAvailableSubjects, isSupplementaryRegistration)}</span>

                      {subjectStatus && (
                        <div className="sr-subject-status-row">
                          <SubjectStatusBadge
                            status={subjectStatus}
                          />
                        </div>
                      )}

                      <small>
                        {getCreditHours(detail).toFixed(2)} Credits
                      </small>

                      {letterGrade && (
                        <small>
                          Previous Grade: {letterGrade}
                        </small>
                      )}

                      {gradePoint != null && (
                        <small>
                          Grade Point:{" "}
                          {Number(gradePoint).toFixed(2)}
                        </small>
                      )}

                      <small>
                        {subjectIdLabel}: {subjectId ?? "N/A"}
                      </small>
                    </div>

                    {isEditable && (
                      <button
                        type="button"
                        className="sr-remove-button"
                        title="Remove subject"
                        disabled={saving}
                        onClick={() =>
                          onRemoveSubject?.(detail)
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                );
              })}
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
              onChange={(event) =>
                setRemarks?.(event.target.value)
              }
            />

            {isEditable && (
              <button
                type="button"
                className="sr-secondary-button sr-save-remarks"
                disabled={saving}
                onClick={onSaveRemarks}
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
                disabled={!canSubmitApplication || saving}
                onClick={handleSubmitApplication}
              >
                {saving ? (
                  <Loader2
                    size={17}
                    className="sr-spin"
                  />
                ) : (
                  <Send size={17} />
                )}

                Submit Application
              </button>

              {!canSubmitApplication && (
                <p className="sr-validation-message">
                  {validationMessage}
                </p>
              )}

              {canSubmitApplication && (
                <p className="sr-validation-message">
                  <CheckCircle2 size={15} />
                  {isRegularRegistration
                    ? "All available subjects have been selected."
                    : "Your subject selection is valid."}
                </p>
              )}

              <button
                type="button"
                className="sr-cancel-button"
                onClick={onCancelApplication}
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
  );
}
