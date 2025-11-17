import React, { useState } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "../provider/authProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import AuthenticatedLayout from "../layouts/AuthenticatedLayout";
import useAuthStorage from "../hooks/useAuthStorage";

// Lazy Imports
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Courses = lazy(() => import("../pages/Courses"));
const Results = lazy(() => import("../pages/Results"));
const Profile = lazy(() => import("../pages/Profile"));
const Settings = lazy(() => import("../pages/Settings"));
const Login = lazy(() => import("../pages/Login"));
const Logout = lazy(() => import("../pages/Logout"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));

const Loader = () => <div className="loader">Loading...</div>;

const AppRoutes = () => {
  const { token, setToken } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [studentID, setStudentID] = useState("");

  // 🔥 Load values from localStorage on refresh
  useAuthStorage({
    setUsername,
    setEmail,
    setStudentID,
    setToken
  });

  const routes = createBrowserRouter([
    {
      path: "/login",
      element: (
        <Suspense fallback={<Loader />}>
          <Login
            username={username}
            setUsername={setUsername}
            setStudentID={setStudentID}
            setEmail={setEmail}
          />
        </Suspense>
      ),
    },
    {
      path: "/logout",
      element: (
        <Suspense fallback={<Loader />}>
          <Logout />
        </Suspense>
      ),
    },
    {
      path: "/reset-password",
      element: (
        <Suspense fallback={<Loader />}>
          <ResetPassword />
        </Suspense>
      ),
    },
    {
      path: "/",
      element: <ProtectedRoute />,
      children: [
        {
          element: <AuthenticatedLayout username={username} />,
          children: [
            { index: true, element: <Suspense fallback={<Loader />}><Dashboard /></Suspense> },
            { path: "courses", element: <Suspense fallback={<Loader />}><Courses student_id={studentID} token={token} /></Suspense> },
            { path: "results", element: <Suspense fallback={<Loader />}><Results student_id={studentID} token={token} /></Suspense> },
            { path: "profile", element: <Suspense fallback={<Loader />}><Profile student_id={studentID} token={token} /></Suspense> },
            { path: "settings", element: <Suspense fallback={<Loader />}><Settings student_id={studentID} username={username} email={email} setEmail={setEmail} token={token} /></Suspense> },
          ],
        },
      ],
    },
  ]);

  return <RouterProvider router={routes} />;
};

export default AppRoutes;
