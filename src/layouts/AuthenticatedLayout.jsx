import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./AuthenticatedLayout.css";

const AuthenticatedLayout = ({ username }) => (
  <div className="authenticated-layout">
    <Sidebar />
    <div className="main-content">
      <Topbar username={username} />
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AuthenticatedLayout;
