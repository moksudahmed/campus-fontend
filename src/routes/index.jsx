import { RouterProvider, createBrowserRouter, Link, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useAuth } from "../provider/authProvider";
import { ProtectedRoute } from "./ProtectedRoute";
import Courses from "../pages/Courses";
import Dashboard from "../pages/Dashboard";

// Lazy-loaded pages (better performance)
const Login = lazy(() => import("../pages/Login"));
const Logout = lazy(() => import("../pages/Logout"));
const UserHome = () => <div>User Home Page</div>;
const UserProfile = () => <div>User Profile</div>;
const PublicService = () => <div>Service Page</div>;
const AboutUs = () => <div>About Us</div>;
const GuestHome = () => <div>Welcome to Our Platform</div>;

// Loader while lazy components load
const Loader = () => (
  <div className="flex h-screen items-center justify-center text-lg text-gray-600">
    Loading...
  </div>
);

/** Layout for Public/Guest users */
const PublicLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <nav className="bg-blue-600 p-4 shadow-md">
      <ul className="flex space-x-6 text-white font-medium">
        <li><Link to="/" className="hover:text-gray-200">Home</Link></li>
        <li><Link to="/service" className="hover:text-gray-200">Service</Link></li>
        <li><Link to="/about-us" className="hover:text-gray-200">About Us</Link></li>
        <li><Link to="/login" className="hover:text-gray-200">Login</Link></li>
      </ul>
    </nav>
    <main className="p-6">
      <Outlet />
    </main>
  </div>
);

/** Layout for Authenticated users */
const AuthenticatedLayout = () => (
  <div className="min-h-screen flex bg-gray-100">
    {/* Sidebar */}
    <aside className="w-64 bg-gray-800 text-white p-6">
      <h2 className="text-xl font-bold mb-6">User Panel</h2>
      <ul className="space-y-4">
        <li><Link to="/" className="block hover:text-gray-300">Dashboard</Link></li>
        <li><Link to="/profile" className="block hover:text-gray-300">Profile</Link></li>
        <li><Link to="/results" className="block hover:text-gray-300">Results</Link></li>
        <li><Link to="/logout" className="block hover:text-gray-300">Logout</Link></li>
      </ul>
    </aside>

    {/* Main Content */}
    <div className="flex-1 flex flex-col">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Welcome Back 👋</h1>
        <span className="text-sm text-gray-600">Authenticated Area</span>
      </header>
      <main className="p-6 flex-1 bg-gray-50 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  </div>
);

const AppRoutes2 = () => {
  const { token } = useAuth();

  /** Public routes */
  const publicRoutes = [
    {
      path: "/",
      element: <PublicLayout />,
      children: [
        { path: "/", element: <GuestHome /> },
        { path: "/service", element: <PublicService /> },
        { path: "/about-us", element: <AboutUs /> },
        { path: "/login", element: <Login /> },
      ],
    },
  ];

  /** Authenticated routes */
  const authenticatedRoutes = [
    {
      path: "/",
      element: (
        
          <AuthenticatedLayout />
        
      ),
      children: [
        { path: "/", element: <Dashboard /> },
        { path: "/profile", element: <UserProfile /> },
        { path: "/results", element: <Courses /> },
        { path: "/logout", element: <Logout /> },
      ],
    },
  ];

  /** Final route configuration */
  const router = createBrowserRouter([
    ...(!token ? publicRoutes : []),
    ...authenticatedRoutes,
  ]);

  return (
    <Suspense fallback={<Loader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default AppRoutes2;
