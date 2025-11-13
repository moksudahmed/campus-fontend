import React from "react";
import MessageCard from "../components/MessageCard";

const messagesData = [
  { from: "Professor John", subject: "Assignment Feedback", date: "2025-09-20" },
  { from: "Admin Office", subject: "Exam Schedule", date: "2025-09-19" },
  { from: "Advisor", subject: "Course Registration", date: "2025-09-18" },
];

const Messages = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Messages</h1>
      <div className="card-grid">
        {messagesData.map((msg, index) => (
          <MessageCard key={index} from={msg.from} subject={msg.subject} date={msg.date} />
        ))}
      </div>
    </div>
  );
};

export default Messages;
