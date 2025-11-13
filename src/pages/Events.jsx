import React from "react";
import EventCard from "../components/EventCard";

const eventsData = [
  { title: "Science Club Workshop", date: "2025-09-21" },
  { title: "Math Assignment Deadline", date: "2025-09-23" },
  { title: "Cultural Fest", date: "2025-10-01" },
];

const Events = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Events</h1>
      <div className="card-grid">
        {eventsData.map((event, index) => (
          <EventCard key={index} title={event.title} date={event.date} />
        ))}
      </div>
    </div>
  );
};

export default Events;
