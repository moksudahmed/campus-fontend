import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { BookOpen, CalendarDays, MessageSquare } from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import { fetchCurrentTermCourses } from "../api/course";

const Dashboard = ({ student_id, token }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetchCurrentTermCourses(student_id, token);
        setCourses(res || []);
      } catch (error) {
        console.error("Error retrieving course enrollment records:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [student_id, token]);

  if (loading) {
    return <div className={styles.loading}>Loading enrolled courses…</div>;
  }

  return (
    <div className={styles.backgroundWrapper}>
      <div className={styles.overlay}>
        <div className={styles.container}>
          
          {/* Academic Summary Cards */}
          <div className={styles.cardGrid}>
            <DashboardCard
              title="Enrolled Courses"
              count={courses.length}
              color="indigo"
              icon={<BookOpen className={styles.iconIndigo} />}
              subtitle="Active this semester"
            />

            <DashboardCard
              title="Upcoming Academic Events"
              count={0}
              color="green"
              icon={<CalendarDays className={styles.iconGreen} />}
              subtitle="Campus & departmental"
            />

            <DashboardCard
              title="Unread Messages"
              count={0}
              color="yellow"
              icon={<MessageSquare className={styles.iconYellow} />}
              subtitle="Faculty & administration"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;