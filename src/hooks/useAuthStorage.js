import { useEffect } from "react";

export default function useAuthStorage({ setUsername, setEmail, setStudentID, setToken }) {

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedStudentID = localStorage.getItem("student_id");
    const storedEmail = localStorage.getItem("email");

    if (storedToken) setToken(storedToken);
    if (storedStudentID) setStudentID(storedStudentID);
    if (storedEmail) setEmail(storedEmail);

  }, [setUsername, setEmail, setStudentID, setToken]);
}
