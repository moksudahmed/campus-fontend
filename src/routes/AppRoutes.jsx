import React, { useState } from "react";
import { RouterProvider, createBrowserRouter, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "../provider/authProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import AuthenticatedLayout from "../layouts/AuthenticatedLayout";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const Courses = lazy(() => import("../pages/Courses"));
const Results = lazy(() => import("../pages/Results"));
const Events = lazy(() => import("../pages/Events"));
const Messages = lazy(() => import("../pages/Messages"));
const Profile = lazy(() => import("../pages/Profile"));
const Login = lazy(() => import("../pages/Login"));
const Logout = lazy(() => import("../pages/Logout"));
const Settings = lazy(() => import("../pages/Settings"));
const ResetPassword = lazy(()=>import("../pages/ResetPassword"));
// Loader for Suspense
const Loader = () => (
  <div className="loader">
    Loading...
  </div>
);

const AppRoutes = () => {
  const { token } = useAuth();  
  const [username, setUsername] = useState("");
  const [studentID, setStudentID] = useState("");
  const [person_id, setPersonID] = useState("");
  const [role, setRole] = useState("");
  const [student, setStudent] = useState(null);
  console.log(studentID);
  const routes = createBrowserRouter([
    {
      path: "/login",
      element: <Suspense fallback={<Loader />}><Login username={username} setUsername={setUsername} setStudentID={setStudentID} /></Suspense>,
    },
    {
      path: "/logout",
      element: <Suspense fallback={<Loader />}><Logout /></Suspense>,
    },
    {
      path: "/reset-password",
      element: <Suspense fallback={<Loader />}><ResetPassword /></Suspense>,
    },    
    {
      path: "/",
      element: <ProtectedRoute />, // protects authenticated routes
      children: [
        {
          element: <AuthenticatedLayout username={username}/>, // Sidebar + Topbar layout
          children: [
            { index: true, element: <Suspense fallback={<Loader />}><Dashboard /></Suspense> },
            { path: "courses", element: <Suspense fallback={<Loader />}><Courses student_id={username} token={token}/></Suspense> },
            { path: "results", element: <Suspense fallback={<Loader />}><Results student_id={username} token={token}/></Suspense> },
            //{ path: "events", element: <Suspense fallback={<Loader />}><Events /></Suspense> },
            //{ path: "messages", element: <Suspense fallback={<Loader />}><Messages /></Suspense> },
            { path: "profile", element: <Suspense fallback={<Loader />}><Profile student_id={username} token={token}/></Suspense> },
            { path: "settings", element: <Suspense fallback={<Loader />}><Settings student_id={username} username={username} token={token}/></Suspense> },
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={routes} />;
};

export default AppRoutes;
