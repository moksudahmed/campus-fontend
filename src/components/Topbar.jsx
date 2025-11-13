import React from "react";
import { User } from "lucide-react";
import "./Topbar.css";

const Topbar = ({ username }) => {
  return (
    <header className="topbar">
      <div className="topbar-container">
        <div>
          <h1 className="topbar-title">
            🎓 Welcome Back to <span>Student Portal</span>
          </h1>
          <p className="topbar-subtitle">
            Manage your courses, results, and personal information easily.
          </p>
        </div>

        <div className="topbar-user">
          <User className="user-icon" />
          <span className="username">{username || "Guest"}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
