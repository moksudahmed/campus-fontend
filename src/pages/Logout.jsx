// src/pages/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import "./Logout.css";

const Logout = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");    
      localStorage.removeItem("person_id");          
      navigate("/login", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [setToken, navigate]);

  return (
    <div className="logout-container">
      <div className="logout-card">
        <div className="spinner"></div>
        <h2 className="logout-title">Signing you out...</h2>
        <p className="logout-message">
          Please wait while we securely log you out of the portal.
        </p>
      </div>
    </div>
  );
};

export default Logout;
