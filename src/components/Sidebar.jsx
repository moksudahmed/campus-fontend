import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => (
  <aside className="sidebar">
    <h2 className="sidebar-title">Student Portal</h2>
    <nav className="sidebar-nav">
      <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Dashboard</NavLink>
      <NavLink to="/courses" className={({ isActive }) => isActive ? "active" : ""}>Courses</NavLink>
      <NavLink to="/results" className={({ isActive }) => isActive ? "active" : ""}>Academic Performance</NavLink>
     {/* <NavLink to="/events" className={({ isActive }) => isActive ? "active" : ""}>Events</NavLink>
      <NavLink to="/messages" className={({ isActive }) => isActive ? "active" : ""}>Messages</NavLink>*/}
      <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}>Profile</NavLink>
      <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>Settings</NavLink>
      <NavLink to="/logout" className={({ isActive }) => isActive ? "active" : ""}>Logout</NavLink>      
    </nav>
  </aside>
);

export default Sidebar;
