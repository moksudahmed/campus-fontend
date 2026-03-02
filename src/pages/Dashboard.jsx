import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { BookOpen, CalendarDays, MessageSquare } from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import ActivityCard from "../components/ActivityCard";
import { fetchCourses, fetchCurrentTermCourses } from "../api/course";

const Dashboard = ({ student_id, token }) => {
  const [courses, setCoursesLength] = useState(0);
  const [loading, setLoading] = useState(true);
  // Fetch enrolled courses
  useEffect(() => {
    const loadCourses = async () => {
      try {       
        const res = await fetchCurrentTermCourses(student_id, token);        
        setCoursesLength(res)
       
      } catch (error) {
        console.error("Error retrieving course enrollment records:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourses();
  }, [student_id, token]);

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading enrolled courses…
      </div>
    );
  }

  if (!courses.length) {
    return (
      <div className={styles.noData}>
        No enrolled courses found.
      </div>
    );
  }

  return (
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

      {/* Recent Activity */}
      {/*<div className={styles.activitySection}>
        <h2 className={styles.activityTitle}>Recent Academic Activity</h2>

        <div className={styles.activityList}>
          <ActivityCard
            activity="Submitted assignment for Calculus I"
            date="September 23, 2025"
          />
          <ActivityCard
            activity="Attended Research Methodology Workshop"
            date="September 21, 2025"
          />
          <ActivityCard
            activity="Received advisory message from Department Coordinator"
            date="September 20, 2025"
          />
        </div>
      </div>*/}

    </div>
  );
};

export default Dashboard;
