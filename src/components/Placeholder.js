import React from 'react';

export default function Placeholder({ icon: Icon, title, message }) {
  return (
    <div className="panel">
      <div className="card placeholder-card">
        <Icon size={30} strokeWidth={1.5} />
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}
