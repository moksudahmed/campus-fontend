import React, { useEffect, useState } from "react";
import { fetchResults } from "../api/results";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./Results.module.css";

const Results = ({ student_id, token }) => {
  const [groupedResults, setGroupedResults] = useState({});

  // Fetch and group academic results
  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await fetchResults(student_id, token);

        const grouped = data.reduce((acc, item) => {
          const key = `${item.exm_exam_term} ${item.exm_exam_year}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {});

        setGroupedResults(grouped);
      } catch (error) {
        console.error("Error retrieving student results:", error);
      }
    };

    if (student_id && token) loadResults();
  }, [student_id, token]);

  // Export the academic transcript section as PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Student Academic Performance Report", 14, 20);

    let yPos = 30;

    Object.keys(groupedResults).forEach((termYear) => {
      doc.setFontSize(14);
      doc.text(termYear, 14, yPos);
      yPos += 6;

      const columns = [
        "Module Code",
        "Module Name",
        "Credit",
        "Grade",
        "Grade Point",
        "Real Grade Point",
      ];

      const rows = groupedResults[termYear].map((item) => [
        item.module_code,
        item.mod_name,
        item.mod_credit_hour,
        item.letter_grade,
        item.grade_point,
        item.real_gradepoint,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [columns],
        body: rows,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: {
          fillColor: [25, 70, 150],
          textColor: 255,
        },
        margin: { left: 14, right: 14 },
      });

      yPos = doc.lastAutoTable.finalY + 12;
    });

    doc.save(`Academic_Results_${student_id}.pdf`);
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <h1 className={styles.title}>Academic Performance</h1>
        <button onClick={exportPDF} className={styles.pdfButton}>
          Export as PDF
        </button>
      </div>

      {/* No Data */}
      {Object.keys(groupedResults).length === 0 && (
        <p className={styles.noData}>No academic results available.</p>
      )}

      {/* Term-wise Results */}
      {Object.keys(groupedResults).map((termYear) => (
        <div key={termYear} className={styles.termSection}>
          <h2 className={styles.termHeading}>{termYear}</h2>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Module Code</th>
                  <th>Module Name</th>
                  <th>Credit</th>
                  <th>Grade</th>
                  <th>Grade Point</th>
                  <th>Real Grade Point</th>
                </tr>
              </thead>

              <tbody>
                {groupedResults[termYear].map((item) => (
                  <tr key={item.module_code}>
                    <td>{item.module_code}</td>
                    <td>{item.mod_name}</td>
                    <td>{item.mod_credit_hour}</td>
                    <td>{item.letter_grade}</td>
                    <td>{item.grade_point}</td>
                    <td>{item.real_gradepoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Results;
