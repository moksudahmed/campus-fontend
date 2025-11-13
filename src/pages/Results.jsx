import React, { useEffect, useState } from "react";
import { fetchResults } from "../api/results";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // ✅ Correct import for modern builds

const Results = ({ student_id, token }) => {
  const [groupedResults, setGroupedResults] = useState({});

  
  const getTerm = (term) => {
    if (term === 1) return "Spring";
    else if (term === 2) return "Summer";
    else if (term === 3) return "Autumn";
    else return "Not specified";
  };


  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchData = await fetchResults(student_id, token);
        console.log(fetchData);
        // ✅ Group results by term + year        
        const grouped = fetchData.reduce((acc, item) => {
          const key = `${getTerm(item.exm_examTerm)} ${item.exm_examYear}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        }, {});

        setGroupedResults(grouped);
      } catch (err) {
        console.error("❌ Failed to load student result record", err);
      }
    };

    if (student_id && token) loadData();
  }, [student_id, token]);

  // ✅ Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Academic Performance", 14, 20);

    let yOffset = 30;

    Object.keys(groupedResults).forEach((termYear) => {
      // Term/Year heading
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text(termYear, 14, yOffset);
      yOffset += 5;

      const tableColumn = [
        "Module Code",
        "Module Name",
        "Credit",
        "Grade",
        "Grade Point",
        "Real Grade Point",
      ];

      const tableRows = groupedResults[termYear].map((course) => [
        course.moduleCode,
        course.mod_name,
        course.mod_creditHour,
        course.letterGrade,
        course.check_grade_point,
        course.real_gradepoint,
      ]);

      // ✅ Use correct plugin invocation
      autoTable(doc, {
        startY: yOffset,
        head: [tableColumn],
        body: tableRows,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      yOffset = doc.lastAutoTable.finalY + 10;
    });

    doc.save(`Student_${student_id}_Results.pdf`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Academic Performance</h1>
        <button
          onClick={exportPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Export as PDF
        </button>
      </div>

      {Object.keys(groupedResults).length === 0 ? (
        <p className="text-gray-500">No results available.</p>
      ) : (
        Object.keys(groupedResults).map((termYear) => (
          <div key={termYear} className="mb-8">
            <h2 className="text-xl font-semibold text-blue-600 mb-4">
              {termYear}
            </h2>

            <table className="w-full border border-gray-300 rounded-lg shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Module Code</th>
                  <th className="px-4 py-2 border">Module Name</th>
                  <th className="px-4 py-2 border">Credit</th>
                  <th className="px-4 py-2 border">Grade</th>
                  <th className="px-4 py-2 border">Grade Point</th>
                  <th className="px-4 py-2 border">Real Grade Point</th>
                </tr>
              </thead>
              <tbody>
                {groupedResults[termYear].map((course) => (
                  <tr key={course.offered_module_id} className="text-center">
                    <td className="px-4 py-2 border">{course.moduleCode}</td>
                    <td className="px-4 py-2 border">{course.mod_name}</td>
                    <td className="px-4 py-2 border">{course.mod_creditHour}</td>
                    <td className="px-4 py-2 border">{course.letterGrade}</td>
                    <td className="px-4 py-2 border">{course.check_grade_point}</td>
                    <td className="px-4 py-2 border">{course.real_gradepoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default Results;
