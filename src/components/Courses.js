// src/pages/Courses.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { fetchCourses } from "../services/courseService";
import styles from "../styles/Courses.module.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatTerm = (term) => {
  switch (Number(term)) {
    case 1:
      return "Spring";
    case 2:
      return "Summer";
    case 3:
      return "Autumn";
    default:
      return "Not Specified";
  }
};

const getStatusClass = (status) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "regular":
      return styles.statusRegular;

    case "retake":
    case "retaken":
      return styles.statusRetake;

    case "improvement":
      return styles.statusImprovement;

    case "exempted":
      return styles.statusExempted;

    default:
      return styles.statusDefault;
  }
};

const getStatusIcon = (status) => {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "regular":
      return CheckCircle2;

    case "retake":
    case "retaken":
      return RefreshCw;

    case "exempted":
      return XCircle;

    default:
      return Clock3;
  }
};

/* -------------------------------------------------------------------------- */
/* Statistics Card                                                            */
/* -------------------------------------------------------------------------- */

const StatCard = ({
  icon: Icon,
  label,
  value,
  description,
}) => {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>
        <Icon size={21} />
      </div>

      <div className={styles.statContent}>
        <span className={styles.statLabel}>
          {label}
        </span>

        <strong className={styles.statValue}>
          {value}
        </strong>

        {description && (
          <span className={styles.statDescription}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */

const StatusBadge = ({ status }) => {
  const Icon = getStatusIcon(status);

  return (
    <span
      className={`${styles.statusBadge} ${getStatusClass(
        status
      )}`}
    >
      <Icon size={13} />

      <span>{status || "Not Specified"}</span>
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Course Table                                                               */
/* -------------------------------------------------------------------------- */

const CourseTable = ({ courses }) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.codeColumn}>
              Module
            </th>

            <th className={styles.nameColumn}>
              Module Name
            </th>

            <th className={styles.creditColumn}>
              Credit
            </th>

            <th>Group</th>

            <th>Faculty</th>

            <th>Department</th>

            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {courses.map((course, index) => {
            const key =
              course?.offered_module_id ||
              course?.module_code ||
              `course-${index}`;

            return (
              <tr key={key}>
                <td>
                  <div className={styles.moduleCode}>
                    {course?.module_code || "—"}
                  </div>
                </td>

                <td>
                  <div className={styles.moduleName}>
                    {course?.mod_name || "—"}
                  </div>
                </td>

                <td>
                  <span className={styles.creditBadge}>
                    {course?.mod_credit_hour ?? "—"}
                  </span>
                </td>

                <td>
                  <span className={styles.groupValue}>
                    {course?.mod_group || "—"}
                  </span>
                </td>

                <td>
                  <span className={styles.facultyValue}>
                    {course?.faculty_name || "—"}
                  </span>
                </td>

                <td>
                  <span className={styles.departmentValue}>
                    {course?.dpt_code || "—"}
                  </span>
                </td>

                <td>
                  <StatusBadge
                    status={course?.reg_status}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Term Section                                                               */
/* -------------------------------------------------------------------------- */

const TermSection = ({
  termYear,
  courses,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const totalCredits = useMemo(() => {
    return courses.reduce(
      (total, course) =>
        total +
        (Number(course?.mod_credit_hour) || 0),
      0
    );
  }, [courses]);

  return (
    <section className={styles.termSection}>
      <button
        type="button"
        className={styles.termHeader}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className={styles.termHeaderLeft}>
          <div className={styles.termIcon}>
            <CalendarDays size={19} />
          </div>

          <div>
            <h2 className={styles.termHeading}>
              {termYear}
            </h2>

            <p className={styles.termMeta}>
              {courses.length}{" "}
              {courses.length === 1
                ? "course"
                : "courses"}{" "}
              · {totalCredits} credits
            </p>
          </div>
        </div>

        <div className={styles.termHeaderRight}>
          <span className={styles.courseCount}>
            {courses.length}
          </span>

          <ChevronDown
            size={19}
            className={`${styles.chevron} ${
              open ? styles.chevronOpen : ""
            }`}
          />
        </div>
      </button>

      {open && (
        <div className={styles.termContent}>
          <CourseTable courses={courses} />
        </div>
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Loading State                                                              */
/* -------------------------------------------------------------------------- */

const LoadingState = () => {
  return (
    <div className={styles.stateContainer}>
      <div className={styles.loadingCard}>
        <div className={styles.loadingIcon}>
          <BookOpen size={25} />
        </div>

        <div className={styles.spinner} />

        <h3>Loading Your Courses</h3>

        <p>
          Please wait while we retrieve your
          enrollment records.
        </p>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Error State                                                                */
/* -------------------------------------------------------------------------- */

const ErrorState = ({ error, onRetry }) => {
  return (
    <div className={styles.stateContainer}>
      <div className={styles.errorCard}>
        <div className={styles.errorIcon}>
          <XCircle size={28} />
        </div>

        <h2>Unable to Load Courses</h2>

        <p>{error}</p>

        <button
          type="button"
          className={styles.retryButton}
          onClick={onRetry}
        >
          <RefreshCw size={17} />
          Try Again
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Empty State                                                                */
/* -------------------------------------------------------------------------- */

const EmptyState = () => {
  return (
    <div className={styles.emptyCard}>
      <div className={styles.emptyIcon}>
        <BookOpen size={30} />
      </div>

      <h2>No Enrolled Courses</h2>

      <p>
        There are currently no course enrollment
        records available for your account.
      </p>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

const Courses = ({ student_id, token }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  /* ------------------------------------------------------------------------ */
  /* Load Courses                                                             */
  /* ------------------------------------------------------------------------ */

  const loadCourses = useCallback(
    async (signal) => {
      if (!student_id || !token) {
        setCourses([]);
        setError(
          "Student information or authentication token is missing."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchCourses(
          student_id,
          token,
          signal
        );

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid course data received from the server."
          );
        }

        setCourses(data);
      } catch (err) {
        if (
          err?.name === "CanceledError" ||
          err?.name === "AbortError"
        ) {
          return;
        }

        setCourses([]);

        const status = err?.response?.status;

        if (status === 401) {
          setError(
            "Your session has expired. Please log in again to view your courses."
          );
        } else if (status === 403) {
          setError(
            "You do not have permission to view the course enrollment records."
          );
        } else if (status === 404) {
          setError(
            "Course enrollment information was not found."
          );
        } else if (status >= 500) {
          setError(
            "The server is currently unavailable. Please try again later."
          );
        } else if (
          err?.message
            ?.toLowerCase()
            .includes("network") ||
          !err?.response
        ) {
          setError(
            "Unable to connect to the server. Please check your internet connection and try again."
          );
        } else {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              "Unable to retrieve enrolled courses."
          );
        }

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[Courses] Failed to load courses.",
            status
              ? `HTTP ${status}`
              : "Request failed"
          );
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [student_id, token]
  );

  /* ------------------------------------------------------------------------ */
  /* Initial Load                                                             */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const controller = new AbortController();

    loadCourses(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadCourses]);

  /* ------------------------------------------------------------------------ */
  /* Search + Filter                                                          */
  /* ------------------------------------------------------------------------ */

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        [
          course?.module_code,
          course?.mod_name,
          course?.faculty_name,
          course?.dpt_code,
          course?.mod_group,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      const normalizedStatus = String(
        course?.reg_status || ""
      ).toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        normalizedStatus ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [courses, search, statusFilter]);

  /* ------------------------------------------------------------------------ */
  /* Group Courses                                                            */
  /* ------------------------------------------------------------------------ */

  const groupedCourses = useMemo(() => {
    return filteredCourses.reduce(
      (groups, course) => {
        const term = formatTerm(course?.tra_term);
        const year =
          course?.tra_year ?? "Unknown Year";

        const key = `${term} ${year}`;

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(course);

        return groups;
      },
      {}
    );
  }, [filteredCourses]);

  /* ------------------------------------------------------------------------ */
  /* Statistics                                                               */
  /* ------------------------------------------------------------------------ */

  const statistics = useMemo(() => {
    const totalCredits = courses.reduce(
      (total, course) =>
        total +
        (Number(course?.mod_credit_hour) || 0),
      0
    );

    const terms = new Set(
      courses.map(
        (course) =>
          `${formatTerm(course?.tra_term)} ${
            course?.tra_year ?? ""
          }`
      )
    );

    const regularCourses = courses.filter(
      (course) =>
        String(course?.reg_status || "")
          .toLowerCase() === "regular"
    ).length;

    return {
      totalCourses: courses.length,
      totalCredits,
      totalTerms: terms.size,
      regularCourses,
    };
  }, [courses]);

  /* ------------------------------------------------------------------------ */
  /* PDF Export                                                               */
  /* ------------------------------------------------------------------------ */

  const exportPDF = useCallback(() => {
    if (!courses.length) {
      setError(
        "There are no enrolled courses available to export."
      );
      return;
    }

    setExporting(true);
    setError("");

    try {
      const doc = new jsPDF();

      const pageWidth =
        doc.internal.pageSize.getWidth();

      /* Header */
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(
        "Student Course Enrollment Report",
        14,
        20
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      doc.text(
        `Student ID: ${student_id}`,
        14,
        27
      );

      doc.text(
        `Total Courses: ${statistics.totalCourses}`,
        14,
        33
      );

      doc.text(
        `Total Credits: ${statistics.totalCredits}`,
        pageWidth - 14,
        33,
        { align: "right" }
      );

      let yPosition = 42;

      Object.entries(groupedCourses).forEach(
        ([termYear, termCourses]) => {
          if (yPosition > 245) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.text(termYear, 14, yPosition);

          yPosition += 6;

          const rows = termCourses.map(
            (course) => [
              course?.module_code ?? "N/A",
              course?.mod_name ?? "N/A",
              course?.mod_credit_hour ?? "N/A",
              course?.mod_group ?? "N/A",
              course?.faculty_name ?? "N/A",
              course?.dpt_code ?? "N/A",
              course?.reg_status ?? "N/A",
            ]
          );

          autoTable(doc, {
            startY: yPosition,

            head: [
              [
                "Module Code",
                "Module Name",
                "Credit",
                "Group",
                "Faculty",
                "Department",
                "Status",
              ],
            ],

            body: rows,

            theme: "striped",

            styles: {
              fontSize: 7.5,
              cellPadding: 2.2,
              overflow: "linebreak",
            },

            headStyles: {
              fillColor: [31, 78, 121],
              textColor: 255,
              fontSize: 7.5,
              fontStyle: "bold",
            },

            alternateRowStyles: {
              fillColor: [245, 248, 252],
            },

            columnStyles: {
              0: { cellWidth: 24 },
              1: { cellWidth: 42 },
              2: { cellWidth: 14 },
              3: { cellWidth: 18 },
              4: { cellWidth: 30 },
              5: { cellWidth: 25 },
              6: { cellWidth: 24 },
            },

            margin: {
              left: 14,
              right: 14,
            },
          });

          yPosition =
            (doc.lastAutoTable?.finalY ||
              yPosition) + 12;
        }
      );

      doc.save(
        `Enrolled_Courses_${student_id}.pdf`
      );
    } catch (err) {
      setError(
        "Unable to generate the PDF report. Please try again."
      );

      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Courses] PDF generation failed."
        );
      }
    } finally {
      setExporting(false);
    }
  }, [
    courses,
    groupedCourses,
    statistics,
    student_id,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                   */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return <LoadingState />;
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                     */
  /* ------------------------------------------------------------------------ */

  if (error && !courses.length) {
    return (
      <div className={styles.container}>
        <ErrorState
          error={error}
          onRetry={() => {
            const controller =
              new AbortController();

            loadCourses(controller.signal);
          }}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Main UI                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className={styles.container}>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}

      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <GraduationCap size={28} />
          </div>

          <div>
            <div className={styles.eyebrow}>
              ACADEMIC RECORD
            </div>

            <h1 className={styles.title}>
              My Enrolled Courses
            </h1>

            <p className={styles.subtitle}>
              View your registered courses,
              academic terms and enrollment status.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={() => {
              const controller =
                new AbortController();

              loadCourses(controller.signal);
            }}
            title="Refresh courses"
          >
            <RefreshCw size={17} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className={styles.pdfButton}
            onClick={exportPDF}
            disabled={
              exporting || !courses.length
            }
          >
            <Download size={17} />

            <span>
              {exporting
                ? "Generating..."
                : "Export PDF"}
            </span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Student Information                                                 */}
      {/* ------------------------------------------------------------------ */}

      <div className={styles.studentBar}>
        <div className={styles.studentIdentity}>
          <div className={styles.studentAvatar}>
            <GraduationCap size={20} />
          </div>

          <div>
            <span className={styles.studentLabel}>
              STUDENT ID
            </span>

            <strong className={styles.studentId}>
              {student_id || "—"}
            </strong>
          </div>
        </div>

        <div className={styles.recordInfo}>
          <FileText size={16} />

          <span>
            Enrollment records
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Statistics                                                          */}
      {/* ------------------------------------------------------------------ */}

      <div className={styles.statsGrid}>
        <StatCard
          icon={BookOpen}
          label="Total Courses"
          value={statistics.totalCourses}
          description="Enrolled modules"
        />

        <StatCard
          icon={GraduationCap}
          label="Total Credits"
          value={statistics.totalCredits}
          description="Registered credit hours"
        />

        <StatCard
          icon={CalendarDays}
          label="Academic Terms"
          value={statistics.totalTerms}
          description="Terms with enrollment"
        />

        <StatCard
          icon={CheckCircle2}
          label="Regular Courses"
          value={statistics.regularCourses}
          description="Regular registrations"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Search & Filters                                                    */}
      {/* ------------------------------------------------------------------ */}

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search
            size={18}
            className={styles.searchIcon}
          />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search module, faculty, department..."
            aria-label="Search courses"
          />

          {search && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <XCircle size={17} />
            </button>
          )}
        </div>

        <div className={styles.filterWrapper}>
          <label
            htmlFor="statusFilter"
            className={styles.filterLabel}
          >
            Status
          </label>

          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className={styles.filterSelect}
          >
            <option value="all">
              All Statuses
            </option>

            <option value="regular">
              Regular
            </option>

            <option value="retake">
              Retake
            </option>

            <option value="retaken">
              Retaken
            </option>

            <option value="improvement">
              Improvement
            </option>

            <option value="exempted">
              Exempted
            </option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Search Result Information                                           */}
      {/* ------------------------------------------------------------------ */}

      {search || statusFilter !== "all" ? (
        <div className={styles.filterInfo}>
          <span>
            Showing{" "}
            <strong>
              {filteredCourses.length}
            </strong>{" "}
            of{" "}
            <strong>{courses.length}</strong>{" "}
            courses
          </span>

          {(search ||
            statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className={styles.clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Empty Filter Result                                                 */}
      {/* ------------------------------------------------------------------ */}

      {!filteredCourses.length ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>
            <Search size={28} />
          </div>

          <h2>No Matching Courses</h2>

          <p>
            No courses match your current search
            or filter criteria.
          </p>

          <button
            type="button"
            className={styles.clearFiltersButton}
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* ---------------------------------------------------------------- */
        /* Terms                                                             */
        /* ---------------------------------------------------------------- */

        <div className={styles.termsContainer}>
          {Object.entries(groupedCourses).map(
            ([termYear, termCourses], index) => (
              <TermSection
                key={termYear}
                termYear={termYear}
                courses={termCourses}
                defaultOpen={index === 0}
              />
            )
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                              */}
      {/* ------------------------------------------------------------------ */}

      <footer className={styles.pageFooter}>
        <div>
          <BookOpen size={15} />

          <span>
            Showing academic enrollment records
          </span>
        </div>

        <span>
          {filteredCourses.length} courses
        </span>
      </footer>
    </div>
  );
};

export default Courses;