import React from "react";

const EventCard = ({ title, date }) => {
  return (
    <div className="card event-card">
      <h3>{title}</h3>
      <p>{new Date(date).toLocaleDateString()}</p>
    </div>
  );
};

export default EventCard;
