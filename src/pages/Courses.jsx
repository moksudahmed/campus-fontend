import React, { useEffect, useState } from "react";
import { fetchCourses } from "../api/course";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./Courses.module.css";

const Courses = ({ student_id, token }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Convert numeric term to academic term label
  const formatTerm = (term) => {
    switch (term) {
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

  // Fetch enrolled courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await fetchCourses(student_id, token);
        setCourses(data || []);
      } catch (error) {
        console.error("Error retrieving course enrollment records:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [student_id, token]);

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading enrolled courses…
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className={styles.noData}>
        No enrolled courses found.
      </div>
    );
  }

  // Group by Term + Year
  const groupedResults = courses.reduce((acc, course) => {
    const key = `${formatTerm(course.tra_term)} ${course.tra_year}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(course);
    return acc;
  }, {});

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Student Course Enrollment Report", 14, 20);

    let yPos = 28;

    Object.keys(groupedResults).forEach((termYear) => {
      doc.setFontSize(14);
      doc.text(termYear, 14, yPos);
      yPos += 6;

      const tableColumns = [
        "Module Code",
        "Module Name",
        "Credit",
        "Group",
        "Faculty",
        "Department",
        "Reg. Status",
      ];

      const tableRows = groupedResults[termYear].map((crs) => [
        crs.module_code,
        crs.mod_name,
        crs.mod_credit_hour,
        crs.mod_group,
        crs.faculty_name,
        crs.dpt_code,
        crs.reg_status,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [tableColumns],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [25, 70, 150] },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });

      yPos = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`Enrolled_Courses_${student_id}.pdf`);
  };

  return (
    <div className={styles.container}>
      {/* PAGE HEADER */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Enrolled Courses</h1>

        <button className={styles.pdfButton} onClick={exportPDF}>
          Export as PDF
        </button>
      </div>

      {/* TERM-WISE COURSE DISPLAY */}
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
                  <th>Group</th>
                  <th>Faculty</th>
                  <th>Department</th>
                  <th>Reg. Status</th>
                </tr>
              </thead>

              <tbody>
                {groupedResults[termYear].map((course, index) => (
                  <tr key={`${course.module_code}-${index}`}>
                    <td>{course.module_code}</td>
                    <td>{course.mod_name}</td>
                    <td>{course.mod_credit_hour}</td>
                    <td>{course.mod_group}</td>
                    <td>{course.faculty_name}</td>
                    <td>{course.dpt_code}</td>
                    <td>{course.reg_status}</td>
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

export default Courses;
