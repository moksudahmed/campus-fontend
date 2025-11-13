import React, { useEffect, useState } from "react";
import { fetchCourses } from "../api/course";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ import properly

const Courses = ({ student_id, token }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTerm = (term) => {
    if (term === 1) return "Spring";
    else if (term === 2) return "Summer";
    else if (term === 3) return "Autumn";
    else return "Not specified";
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchData = await fetchCourses(student_id, token);
        setCourses(fetchData || []);
        console.log(fetchData);
      } catch (err) {
        console.error("Failed to load student courses record", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [student_id, token]);

  if (loading) {
    return <div className="text-center py-10 text-gray-600">Loading courses...</div>;
  }

  if (!courses.length) {
    return <div className="text-center py-10 text-red-500">No courses found.</div>;
  }

  // ✅ Group courses by term & year
  const groupedResults = courses.reduce((acc, course) => {
    const termYear = `${getTerm(course.tra_term)} ${course.tra_year}`;
    if (!acc[termYear]) acc[termYear] = [];
    acc[termYear].push(course);
    return acc;
  }, {});

  // ✅ Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Student Course Enrollment", 14, 22);
    let yOffset = 30;

    Object.keys(groupedResults).forEach((termYear) => {
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text(termYear, 14, yOffset);
      yOffset += 4;

      const tableColumn = [
        "Module Code",
        "Module Name",
        "Credit",
        "Lab",
        "Group",
        "Faculty",
        "Designation",
        "Department",
        "Reg. Status",
      ];

      const tableRows = groupedResults[termYear].map((course) => [
        course.moduleCode,
        course.mod_name,
        course.mod_credit_hour,
        course.mod_lab_included ? "Yes" : "No",
        course.mod_group,
        course.faculty_name,
        course.fac_designation,
        course.dpt_code,
        course.reg_status,
      ]);

      autoTable(doc, {
        startY: yOffset,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      });

      yOffset = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`Student_${student_id}_Courses.pdf`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-700">My Enrolled Courses</h1>
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Export as PDF
        </button>
      </div>

      {Object.keys(groupedResults).map((termYear) => (
        <div key={termYear} className="mb-10">
          <h2 className="text-xl font-semibold text-indigo-600 mb-4 border-b pb-2">
            {termYear}
          </h2>

          <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Module Code</th>
                  <th className="px-4 py-2 border">Module Name</th>
                  <th className="px-4 py-2 border">Credit</th>
                  <th className="px-4 py-2 border">Lab Included</th>
                  <th className="px-4 py-2 border">Group</th>
                  <th className="px-4 py-2 border">Faculty</th>
                  <th className="px-4 py-2 border">Designation</th>
                  <th className="px-4 py-2 border">Department</th>
                  <th className="px-4 py-2 border">Reg. Status</th>
                </tr>
              </thead>
              <tbody>
                {groupedResults[termYear].map((course, idx) => (
                  <tr
                    key={`${course.moduleCode}-${idx}`}
                    className="text-center hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 border">{course.moduleCode}</td>
                    <td className="px-4 py-2 border">{course.mod_name}</td>
                    <td className="px-4 py-2 border">{course.mod_credit_hour}</td>
                    <td className="px-4 py-2 border">
                      {course.mod_lab_included ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2 border">{course.mod_group}</td>
                    <td className="px-4 py-2 border">{course.faculty_name}</td>
                    <td className="px-4 py-2 border">{course.fac_designation}</td>
                    <td className="px-4 py-2 border">{course.dpt_code}</td>
                    <td className="px-4 py-2 border">{course.reg_status}</td>
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
