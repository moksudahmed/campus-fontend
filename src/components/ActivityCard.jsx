import React from "react";

const ActivityCard = ({ activity, date }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow flex justify-between items-center hover:bg-gray-50 transition duration-200">
      <span className="text-gray-700 font-medium">{activity}</span>
      <span className="text-sm text-gray-500">{date}</span>
    </div>
  );
};

export default ActivityCard;
