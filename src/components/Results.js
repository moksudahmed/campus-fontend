import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  GraduationCap,
  RefreshCw,
} from "lucide-react";

import { fetchCurrentResults } from "../services/resultsService";


import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import styles from "../styles/academicperformance.module.css";


const Results = ({ student_id, token, term, year }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [expandedTerms, setExpandedTerms] = useState({});


  /* =========================================================
     LOAD RESULTS
  ========================================================= */

  const loadResults = useCallback(
    async (signal) => {
      if (!student_id || !token) {
        setResults([]);
        setError(
          "Student information or authentication token is missing."
        );
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await fetchCurrentResults(
          student_id,
          token,
          signal
        );

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid academic result data received from the server."
          );
        }

        setResults(data);

        const terms = data.reduce((acc, item) => {
          const term = item?.exm_exam_term ?? "Unknown Term";
          const year = item?.exm_exam_year ?? "Unknown Year";
          const key = `${term} ${year}`;

          acc[key] = true;

          return acc;
        }, {});

        setExpandedTerms(terms);
      } catch (err) {
        if (
          err?.name === "CanceledError" ||
          err?.name === "AbortError"
        ) {
          return;
        }

        setResults([]);

        const status = err?.response?.status;

        if (status === 401) {
          setError(
            "Your session has expired. Please log in again to view your results."
          );
        } else if (status === 403) {
          setError(
            "You do not have permission to view your academic results."
          );
        } else if (status === 404) {
          setError(
            "Current-term academic results were not found."
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
              "Unable to retrieve academic results."
          );
        }

        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[Results] Failed to load current results.",
            status ? `HTTP ${status}` : "Request failed"
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


  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    const controller = new AbortController();

    loadResults(controller.signal);

    return () => controller.abort();
  }, [loadResults]);


  /* =========================================================
     GROUP RESULTS BY TERM
  ========================================================= */

  const groupedResults = useMemo(() => {
    return results.reduce((acc, item) => {
      const term = item?.exm_exam_term ?? "Unknown Term";
      const year = item?.exm_exam_year ?? "Unknown Year";
      const key = `${term} ${year}`;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(item);

      return acc;
    }, {});
  }, [results]);


  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics = useMemo(() => {
    const totalCourses = results.length;

    const totalCredits = results.reduce(
      (sum, item) =>
        sum + (Number(item?.mod_credit_hour) || 0),
      0
    );

    const gradePoints = results
      .map((item) => Number(item?.grade_point))
      .filter((value) => !Number.isNaN(value));

    const averageGradePoint = gradePoints.length
      ? (
          gradePoints.reduce(
            (sum, value) => sum + value,
            0
          ) / gradePoints.length
        ).toFixed(2)
      : "—";

    const passedCourses = results.filter((item) => {
      const grade = item?.letter_grade
        ?.toString()
        .trim()
        .toUpperCase();

      return (
        grade &&
        !["F", "AB", "U"].includes(grade)
      );
    }).length;

    return {
      totalCourses,
      totalCredits,
      averageGradePoint,
      passedCourses,
    };
  }, [results]);


  /* =========================================================
     TOGGLE TERM
  ========================================================= */

  const toggleTerm = (termYear) => {
    setExpandedTerms((previous) => ({
      ...previous,
      [termYear]: !previous[termYear],
    }));
  };


  /* =========================================================
     GRADE CLASS
  ========================================================= */

  const getGradeClass = (grade) => {
    const value = grade
      ?.toString()
      .trim()
      .toUpperCase();

    if (
      ["A+", "A", "A-", "B+", "B", "B-"].includes(value)
    ) {
      return styles.gradeGood;
    }

    if (
      ["C+", "C", "C-"].includes(value)
    ) {
      return styles.gradeAverage;
    }

    if (
      ["D", "F", "AB", "U"].includes(value)
    ) {
      return styles.gradePoor;
    }

    return styles.gradeNeutral;
  };


  /* =========================================================
     EXPORT PDF
  ========================================================= */

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

      /* Header */

      doc.setFillColor(31, 78, 121);
      doc.rect(0, 0, 210, 30, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);

      doc.text(
        "Student Academic Results",
        14,
        14
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text(
        `Student ID: ${student_id}`,
        14,
        22
      );

      /* Summary */

      let yPos = 40;

      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);

      doc.text(
        "Result Summary",
        14,
        yPos
      );

      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text(
        `Courses: ${statistics.totalCourses}`,
        14,
        yPos
      );

      doc.text(
        `Credits: ${statistics.totalCredits}`,
        65,
        yPos
      );

      doc.text(
        `Average Grade Point: ${statistics.averageGradePoint}`,
        110,
        yPos
      );

      yPos += 14;

      const columns = [
        "Module Code",
        "Module Name",
        "Credit",
        "Grade",
        "Grade Point",
        "Real Grade Point",
      ];

      Object.entries(groupedResults).forEach(
        ([termYear, termResults]) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setTextColor(31, 78, 121);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);

          doc.text(termYear, 14, yPos);

          yPos += 6;

          const rows = termResults.map((item) => [
            item?.module_code ?? "N/A",
            item?.mod_name ?? "N/A",
            item?.mod_credit_hour ?? "N/A",
            item?.letter_grade ?? "N/A",
            item?.grade_point ?? "N/A",
            item?.real_gradepoint ?? "N/A",
          ]);

          autoTable(doc, {
            startY: yPos,
            head: [columns],
            body: rows,

            theme: "grid",

            styles: {
              fontSize: 8,
              cellPadding: 2.5,
              overflow: "linebreak",
              valign: "middle",
            },

            headStyles: {
              fillColor: [31, 78, 121],
              textColor: 255,
              fontSize: 8,
              fontStyle: "bold",
            },

            alternateRowStyles: {
              fillColor: [248, 250, 252],
            },

            columnStyles: {
              0: { cellWidth: 29 },
              1: { cellWidth: 57 },
              2: { cellWidth: 18 },
              3: { cellWidth: 19 },
              4: { cellWidth: 28 },
              5: { cellWidth: 31 },
            },

            margin: {
              left: 14,
              right: 14,
            },
          });

          yPos =
            (doc.lastAutoTable?.finalY || yPos) + 12;
        }
      );

      /* Footer */

      const pageCount =
        doc.internal.getNumberOfPages();

      for (
        let page = 1;
        page <= pageCount;
        page += 1
      ) {
        doc.setPage(page);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);

        doc.text(
          `Student ID: ${student_id}`,
          14,
          290
        );

        doc.text(
          `Page ${page} of ${pageCount}`,
          174,
          290
        );
      }

      doc.save(
        `Academic_Results_${student_id}.pdf`
      );
    } catch (err) {
      setError(
        "Unable to generate the PDF report. Please try again."
      );

      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[Results] PDF generation failed.",
          err
        );
      }
    } finally {
      setExporting(false);
    }
  }, [
    results,
    groupedResults,
    student_id,
    statistics,
  ]);


  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.stateCard}>
          <div className={styles.spinner} />

          <h2>Loading Results</h2>

          <p>
            Please wait while your academic results are loaded.
          </p>
        </div>
      </div>
    );
  }


  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.stateCard}>
          <div
            className={`${styles.stateIcon} ${styles.errorIcon}`}
          >
            <AlertCircle size={24} />
          </div>

          <h2>Unable to Load Results</h2>

          <p>{error}</p>

          <button
            type="button"
            className={styles.retryButton}
            onClick={() => {
              const controller =
                new AbortController();

              loadResults(controller.signal);
            }}
          >
            <RefreshCw size={15} />
            Try Again
          </button>
        </div>
      </div>
    );
  }


  /* =========================================================
     EMPTY
  ========================================================= */

  if (!results.length) {
    return (
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div className={styles.headerIdentity}>
            <div className={styles.headerIcon}>
              <GraduationCap size={21} />
            </div>

            <div>
              <span className={styles.eyebrow}>
                Academic Record
              </span>

              <h1>Current Term Results</h1>

              <p>
                Student ID:{" "}
                <strong>{student_id}</strong>
              </p>
            </div>
          </div>
        </header>

        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <BookOpen size={27} />
          </div>

          <h2>No Results Available</h2>

          <p>
            Your current-term academic results
            have not been published yet.
          </p>
        </div>
      </div>
    );
  }


  /* =========================================================
     MAIN
  ========================================================= */

  return (
    <div className={styles.container}>

      {/* HEADER */}

      <header className={styles.pageHeader}>
        <div className={styles.headerIdentity}>
          <div className={styles.headerIcon}>
            <GraduationCap size={21} />
          </div>

          <div>
            <span className={styles.eyebrow}>
              Academic Record
            </span>

           <h1>
              {term === 1
                ? "Spring"
                : term === 2
                ? "Summer"
                : term === 3
                ? "Autumn"
                : "Current"}{" "}
              {year} Results
            </h1>

            <p>
              Student ID:{" "}
              <strong>{student_id}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          className={styles.exportButton}
          onClick={exportPDF}
          disabled={exporting}
        >
          {exporting ? (
            <>
              <span className={styles.buttonSpinner} />
              Preparing...
            </>
          ) : (
            <>
              <Download size={15} />
              Export PDF
            </>
          )}
        </button>
      </header>


      {/* SUMMARY */}

      <section className={styles.summaryCard}>

        <div className={styles.summaryMain}>
          <span>Average Grade Point</span>

          <strong>
            {statistics.averageGradePoint}
          </strong>

          <small>Out of 4.00</small>
        </div>

        <div className={styles.summaryItem}>
          <span>Courses</span>
          <strong>{statistics.totalCourses}</strong>
        </div>

        <div className={styles.summaryItem}>
          <span>Credit Hours</span>
          <strong>{statistics.totalCredits}</strong>
        </div>

        <div className={styles.summaryItem}>
          <span>Passed</span>
          <strong>{statistics.passedCourses}</strong>
        </div>

      </section>


      {/* RESULTS HEADER */}

      <div className={styles.resultsHeader}>
        <div>
          <h2>Course Results</h2>

          <p>
            Detailed academic performance for the current term.
          </p>
        </div>

        <div className={styles.resultCount}>
          {results.length}{" "}
          {results.length === 1
            ? "Course"
            : "Courses"}
        </div>
      </div>


      {/* RESULTS */}

      <main className={styles.results}>

        {Object.entries(groupedResults).map(
          ([termYear, termResults]) => {

            const isExpanded =
              expandedTerms[termYear] !== false;

            return (
              <section
                key={termYear}
                className={styles.termSection}
              >

                {/* TERM HEADER */}

                <button
                  type="button"
                  className={styles.termHeader}
                  onClick={() =>
                    toggleTerm(termYear)
                  }
                  aria-expanded={isExpanded}
                >
                  <div className={styles.termIdentity}>
                    <div className={styles.termIcon}>
                      <BookOpen size={15} />
                    </div>

                    <div>
                      <span>Academic Term</span>

                      <h3>{termYear}</h3>
                    </div>
                  </div>

                  <div className={styles.termRight}>
                    <span>
                      {termResults.length}{" "}
                      {termResults.length === 1
                        ? "Course"
                        : "Courses"}
                    </span>

                    {isExpanded ? (
                      <ChevronUp size={17} />
                    ) : (
                      <ChevronDown size={17} />
                    )}
                  </div>
                </button>


                {/* TABLE */}

                {isExpanded && (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>

                      <thead>
                        <tr>
                          <th>Module</th>
                          <th>Course Name</th>
                          <th className={styles.center}>
                            Credit
                          </th>
                          <th className={styles.center}>
                            Grade
                          </th>
                          <th className={styles.center}>
                            Grade Point
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {termResults.map(
                          (item, index) => (
                            <tr
                              key={`${
                                item?.offered_module_id ||
                                item?.module_code ||
                                "result"
                              }-${index}`}
                            >

                              <td>
                                <span
                                  className={
                                    styles.moduleCode
                                  }
                                >
                                  {item?.module_code || "—"}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={
                                    styles.courseName
                                  }
                                >
                                  {item?.mod_name || "—"}
                                </span>
                              </td>

                              <td
                                className={styles.center}
                              >
                                <span
                                  className={
                                    styles.creditValue
                                  }
                                >
                                  {item?.mod_credit_hour ?? "—"}
                                </span>
                              </td>

                              <td
                                className={styles.center}
                              >
                                <span
                                  className={`${styles.grade} ${getGradeClass(
                                    item?.letter_grade
                                  )}`}
                                >
                                  {item?.letter_grade || "—"}
                                </span>
                              </td>

                              <td
                                className={styles.center}
                              >
                                <span
                                  className={
                                    styles.gradePoint
                                  }
                                >
                                  {item?.grade_point ?? "—"}
                                </span>
                              </td>

                            </tr>
                          )
                        )}
                      </tbody>

                    </table>
                  </div>
                )}

              </section>
            );
          }
        )}

      </main>


      {/* NOTE */}

      <div className={styles.note}>
        <AlertCircle size={14} />

        <span>
          Results are based on the academic records
          currently published by the university.
        </span>
      </div>

    </div>
  );
};


export default Results;