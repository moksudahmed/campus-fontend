// src/pages/AcademicPerformance.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  FileText,
  GraduationCap,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { fetchResults } from "../services/resultsService";
import styles from "../styles/academicperformance.module.css";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const getGradeClass = (grade) => {
  const value = String(grade || "")
    .trim()
    .toUpperCase();

  if (["A+", "A"].includes(value)) {
    return styles.gradeExcellent;
  }

  if (["A-", "B+"].includes(value)) {
    return styles.gradeVeryGood;
  }

  if (["B", "B-"].includes(value)) {
    return styles.gradeGood;
  }

  if (["C+", "C"].includes(value)) {
    return styles.gradeAverage;
  }

  if (["C-", "D+", "D"].includes(value)) {
    return styles.gradeLow;
  }

  if (
    ["F", "AB", "I", "W"].includes(value)
  ) {
    return styles.gradeFailed;
  }

  return styles.gradeDefault;
};

const getGradeIcon = (grade) => {
  const value = String(grade || "")
    .trim()
    .toUpperCase();

  if (
    ["A+", "A", "A-", "B+"].includes(value)
  ) {
    return Award;
  }

  if (["B", "B-", "C+", "C"].includes(value)) {
    return CheckCircle2;
  }

  return TrendingUp;
};

/* -------------------------------------------------------------------------- */
/* Grade Badge                                                                */
/* -------------------------------------------------------------------------- */

const GradeBadge = ({ grade }) => {
  const Icon = getGradeIcon(grade);

  return (
    <span
      className={`${styles.gradeBadge} ${
        getGradeClass(grade)
      }`}
    >
      <Icon size={13} />

      <strong>{grade || "—"}</strong>
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Statistic Card                                                             */
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
        <Icon size={20} />
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
/* Result Table                                                               */
/* -------------------------------------------------------------------------- */

const ResultTable = ({ results }) => {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.moduleColumn}>
              Module
            </th>

            <th className={styles.moduleNameColumn}>
              Module Name
            </th>

            <th className={styles.creditColumn}>
              Credit
            </th>

            <th>Grade</th>

            <th>Grade Point</th>

            <th>Real Grade Point</th>
          </tr>
        </thead>

        <tbody>
          {results.map((item, index) => (
            <tr
              key={`${
                item?.offered_module_id ||
                item?.module_code ||
                "result"
              }-${index}`}
            >
              <td>
                <span className={styles.moduleCode}>
                  {item?.module_code || "—"}
                </span>
              </td>

              <td>
                <div className={styles.moduleName}>
                  {item?.mod_name || "—"}
                </div>
              </td>

              <td>
                <span className={styles.creditBadge}>
                  {item?.mod_credit_hour ?? "—"}
                </span>
              </td>

              <td>
                <GradeBadge
                  grade={item?.letter_grade}
                />
              </td>

              <td>
                <span className={styles.gradePoint}>
                  {item?.grade_point ?? "—"}
                </span>
              </td>

              <td>
                <span
                  className={
                    styles.realGradePoint
                  }
                >
                  {item?.real_gradepoint ?? "—"}
                </span>
              </td>
            </tr>
          ))}
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
  results,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const statistics = useMemo(() => {
    const credits = results.reduce(
      (total, item) =>
        total +
        (Number(item?.mod_credit_hour) || 0),
      0
    );

    const gradePoints = results
      .map((item) => Number(item?.grade_point))
      .filter((value) => !Number.isNaN(value));

    const average =
      gradePoints.length > 0
        ? gradePoints.reduce(
            (sum, value) => sum + value,
            0
          ) / gradePoints.length
        : null;

    return {
      courses: results.length,
      credits,
      average:
        average !== null
          ? average.toFixed(2)
          : "—",
    };
  }, [results]);

  return (
    <section className={styles.termSection}>
      <button
        type="button"
        className={styles.termHeader}
        onClick={() =>
          setOpen((previous) => !previous)
        }
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
              {statistics.courses}{" "}
              {statistics.courses === 1
                ? "course"
                : "courses"}{" "}
              · {statistics.credits} credits
            </p>
          </div>
        </div>

        <div className={styles.termSummary}>
          <div className={styles.termStat}>
            <span>Avg. GP</span>
            <strong>{statistics.average}</strong>
          </div>

          <span className={styles.courseCount}>
            {statistics.courses}
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
          <ResultTable results={results} />
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
          <GraduationCap size={27} />
        </div>

        <div className={styles.spinner} />

        <h3>Loading Academic Results</h3>

        <p>
          Please wait while we retrieve your
          academic performance records.
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
          <XCircle size={29} />
        </div>

        <h2>Unable to Load Results</h2>

        <p>{error}</p>

        <button
          type="button"
          className={styles.retryButton}
          onClick={onRetry}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

const AcademicPerformance = ({
  student_id,
  token,
}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] =
    useState("all");

  /* ------------------------------------------------------------------------ */
  /* Load Results                                                             */
  /* ------------------------------------------------------------------------ */

  const loadResults = useCallback(
    async (signal) => {
      if (!student_id || !token) {
        setResults([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchResults(
          student_id,
          token
        );

        if (!Array.isArray(data)) {
          throw new Error(
            "The server returned an invalid academic results response."
          );
        }

        if (!signal?.aborted) {
          setResults(data);
        }
      } catch (err) {
        if (signal?.aborted) {
          return;
        }

        setResults([]);

        const status = err?.response?.status;

        if (
          status === 401 ||
          status === 403
        ) {
          setError(
            "Your session has expired or you are not authorized to view these results. Please log in again."
          );
        } else if (status === 404) {
          setError(
            "No academic results were found for this student."
          );
        } else if (status >= 500) {
          setError(
            "The academic results service is temporarily unavailable. Please try again later."
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
              "Unable to load academic results. Please try again."
          );
        }

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[AcademicPerformance] Failed to load results.",
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

    loadResults(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadResults]);

  /* ------------------------------------------------------------------------ */
  /* Filter Results                                                           */
  /* ------------------------------------------------------------------------ */

  const filteredResults = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return results.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item?.module_code,
          item?.mod_name,
          item?.letter_grade,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );

      const grade = String(
        item?.letter_grade || ""
      ).toUpperCase();

      let matchesGrade = true;

      if (gradeFilter === "excellent") {
        matchesGrade = [
          "A+",
          "A",
          "A-",
        ].includes(grade);
      }

      if (gradeFilter === "good") {
        matchesGrade = [
          "B+",
          "B",
          "B-",
        ].includes(grade);
      }

      if (gradeFilter === "average") {
        matchesGrade = [
          "C+",
          "C",
          "C-",
        ].includes(grade);
      }

      if (gradeFilter === "failed") {
        matchesGrade = [
          "D",
          "F",
          "AB",
        ].includes(grade);
      }

      return matchesSearch && matchesGrade;
    });
  }, [results, search, gradeFilter]);

  /* ------------------------------------------------------------------------ */
  /* Group Results                                                            */
  /* ------------------------------------------------------------------------ */

  const groupedResults = useMemo(() => {
    return filteredResults.reduce(
      (groups, item) => {
        const term =
          item?.exm_exam_term ||
          "Unknown Term";

        const year =
          item?.exm_exam_year ||
          "Unknown Year";

        const key = `${term} ${year}`;

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(item);

        return groups;
      },
      {}
    );
  }, [filteredResults]);

  /* ------------------------------------------------------------------------ */
  /* Overall Statistics                                                       */
  /* ------------------------------------------------------------------------ */

  const statistics = useMemo(() => {
    const totalCredits = results.reduce(
      (total, item) =>
        total +
        (Number(item?.mod_credit_hour) || 0),
      0
    );

    const gradePoints = results
      .map((item) =>
        Number(item?.grade_point)
      )
      .filter(
        (value) => !Number.isNaN(value)
      );

    const averageGradePoint =
      gradePoints.length
        ? gradePoints.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / gradePoints.length
        : null;

    const passed = results.filter((item) => {
      const grade = String(
        item?.letter_grade || ""
      ).toUpperCase();

      return !["F", "AB"].includes(grade);
    }).length;

    const failed = results.length - passed;

    const terms = new Set(
      results.map(
        (item) =>
          `${item?.exm_exam_term || "Unknown"} ${
            item?.exm_exam_year || ""
          }`
      )
    );

    return {
      courses: results.length,
      credits: totalCredits,
      terms: terms.size,
      passed,
      failed,
      average:
        averageGradePoint !== null
          ? averageGradePoint.toFixed(2)
          : "—",
    };
  }, [results]);

  /* ------------------------------------------------------------------------ */
  /* Retry                                                                    */
  /* ------------------------------------------------------------------------ */

  const handleRetry = useCallback(() => {
    const controller =
      new AbortController();

    loadResults(controller.signal);
  }, [loadResults]);

  /* ------------------------------------------------------------------------ */
  /* Export PDF                                                               */
  /* ------------------------------------------------------------------------ */

  const exportPDF = useCallback(() => {
    if (!results.length) {
      setError(
        "There are no academic results available to export."
      );
      return;
    }

    setExporting(true);
    setError("");

    try {
      const doc = new jsPDF();

      const pageWidth =
        doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);

      doc.text(
        "Student Academic Performance Report",
        14,
        20
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      doc.text(
        `Student ID: ${student_id}`,
        14,
        28
      );

      doc.text(
        `Total Courses: ${statistics.courses}`,
        14,
        34
      );

      doc.text(
        `Total Credits: ${statistics.credits}`,
        pageWidth - 14,
        34,
        {
          align: "right",
        }
      );

      doc.text(
        `Average Grade Point: ${statistics.average}`,
        pageWidth - 14,
        40,
        {
          align: "right",
        }
      );

      let yPosition = 48;

      Object.entries(
        groupedResults
      ).forEach(
        ([termYear, termResults]) => {
          if (yPosition > 245) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);

          doc.text(
            termYear,
            14,
            yPosition
          );

          yPosition += 6;

          const rows = termResults.map(
            (item) => [
              item?.module_code ?? "-",
              item?.mod_name ?? "-",
              item?.mod_credit_hour ?? "-",
              item?.letter_grade ?? "-",
              item?.grade_point ?? "-",
              item?.real_gradepoint ?? "-",
            ]
          );

          autoTable(doc, {
            startY: yPosition,

            head: [
              [
                "Module Code",
                "Module Name",
                "Credit",
                "Grade",
                "Grade Point",
                "Real Grade Point",
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
              fillColor: [
                31,
                78,
                121,
              ],
              textColor: 255,
              fontStyle: "bold",
            },

            alternateRowStyles: {
              fillColor: [
                245,
                248,
                252,
              ],
            },

            columnStyles: {
              0: {
                cellWidth: 25,
              },
              1: {
                cellWidth: 52,
              },
              2: {
                cellWidth: 17,
              },
              3: {
                cellWidth: 18,
              },
              4: {
                cellWidth: 25,
              },
              5: {
                cellWidth: 31,
              },
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
        `Academic_Results_${student_id}.pdf`
      );
    } catch (err) {
      setError(
        "Unable to generate the PDF report. Please try again."
      );

      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[AcademicPerformance] PDF export failed."
        );
      }
    } finally {
      setExporting(false);
    }
  }, [
    groupedResults,
    results,
    statistics,
    student_id,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return <LoadingState />;
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                    */
  /* ------------------------------------------------------------------------ */

  if (error && !results.length) {
    return (
      <div className={styles.container}>
        <ErrorState
          error={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Main UI                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className={styles.container}>
      {/* Header */}
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
              Academic Performance
            </h1>

            <p className={styles.subtitle}>
              Review your academic results,
              grades and performance history.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={handleRetry}
            disabled={loading}
          >
            <RefreshCw size={17} />

            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={exportPDF}
            className={styles.pdfButton}
            disabled={
              !results.length ||
              loading ||
              exporting
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

      {/* Student Information */}
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
            Academic performance records
          </span>
        </div>
      </div>

      {/* Statistics */}
      {results.length > 0 && (
        <div className={styles.statsGrid}>
          <StatCard
            icon={BookOpen}
            label="Total Courses"
            value={statistics.courses}
            description="Courses with results"
          />

          <StatCard
            icon={GraduationCap}
            label="Total Credits"
            value={statistics.credits}
            description="Completed credit hours"
          />

          <StatCard
            icon={TrendingUp}
            label="Average Grade Point"
            value={statistics.average}
            description="Across recorded results"
          />

          <StatCard
            icon={CalendarDays}
            label="Academic Terms"
            value={statistics.terms}
            description="Terms with results"
          />
        </div>
      )}

      {/* Search / Filters */}
      {results.length > 0 && (
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
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search module, course or grade..."
              aria-label="Search academic results"
            />

            {search && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <XCircle size={17} />
              </button>
            )}
          </div>

          <div className={styles.filterWrapper}>
            <label
              htmlFor="gradeFilter"
              className={styles.filterLabel}
            >
              Grade
            </label>

            <select
              id="gradeFilter"
              value={gradeFilter}
              onChange={(event) =>
                setGradeFilter(
                  event.target.value
                )
              }
              className={styles.filterSelect}
            >
              <option value="all">
                All Grades
              </option>

              <option value="excellent">
                A Range
              </option>

              <option value="good">
                B Range
              </option>

              <option value="average">
                C Range
              </option>

              <option value="failed">
                D / F / AB
              </option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Info */}
      {results.length > 0 &&
        (search ||
          gradeFilter !== "all") && (
          <div className={styles.filterInfo}>
            <span>
              Showing{" "}
              <strong>
                {filteredResults.length}
              </strong>{" "}
              of{" "}
              <strong>
                {results.length}
              </strong>{" "}
              results
            </span>

            <button
              type="button"
              className={styles.clearFilters}
              onClick={() => {
                setSearch("");
                setGradeFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

      {/* Empty */}
      {!loading &&
        !error &&
        !results.length && (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>
              <BookOpen size={30} />
            </div>

            <h2>No Academic Results</h2>

            <p>
              No academic results are currently
              available for this student.
            </p>
          </div>
        )}

      {/* No Filter Results */}
      {results.length > 0 &&
        !filteredResults.length && (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>
              <Search size={28} />
            </div>

            <h2>No Matching Results</h2>

            <p>
              No academic results match your
              current search or grade filter.
            </p>

            <button
              type="button"
              className={
                styles.clearFiltersButton
              }
              onClick={() => {
                setSearch("");
                setGradeFilter("all");
              }}
            >
              Clear Filters
            </button>
          </div>
        )}

      {/* Results */}
      {filteredResults.length > 0 && (
        <div className={styles.termsContainer}>
          {Object.entries(
            groupedResults
          ).map(
            (
              [termYear, termResults],
              index
            ) => (
              <TermSection
                key={termYear}
                termYear={termYear}
                results={termResults}
                defaultOpen={index === 0}
              />
            )
          )}
        </div>
      )}

      {/* Footer */}
      {results.length > 0 && (
        <footer className={styles.pageFooter}>
          <div>
            <FileText size={15} />

            <span>
              Academic performance records
            </span>
          </div>

          <span>
            {filteredResults.length} results
          </span>
        </footer>
      )}
    </div>
  );
};

export default AcademicPerformance;