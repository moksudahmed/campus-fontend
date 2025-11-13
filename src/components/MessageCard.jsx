import React from "react";

const MessageCard = ({ from, subject, date }) => {
  return (
    <div className="card message-card">
      <h3>{subject}</h3>
      <p>From: {from}</p>
      <span>{new Date(date).toLocaleDateString()}</span>
    </div>
  );
};

export default MessageCard;
