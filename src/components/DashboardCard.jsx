import React from "react";

const DashboardCard = ({ title, count, color, icon }) => {
  return (
    <div
      className={`flex items-center justify-between p-6 rounded-2xl shadow-md bg-white hover:shadow-xl transition duration-300 border-l-4 border-${color}-500`}
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        <p className="text-3xl font-bold text-gray-900">{count}</p>
      </div>
      <div className="bg-gray-100 p-3 rounded-full">{icon}</div>
    </div>
  );
};

export default DashboardCard;
