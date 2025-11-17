import React from "react";
import styles from "./Dashboard.module.css";
import { BookOpen, CalendarDays, MessageSquare } from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import ActivityCard from "../components/ActivityCard";

const Dashboard = () => {
  return (
    <div className={styles.container}>
      
      {/* Academic Summary Cards */}
      <div className={styles.cardGrid}>
        <DashboardCard
          title="Enrolled Courses"
          count={5}
          color="indigo"
          icon={<BookOpen className={styles.iconIndigo} />}
          subtitle="Active this semester"
        />

        <DashboardCard
          title="Upcoming Academic Events"
          count={3}
          color="green"
          icon={<CalendarDays className={styles.iconGreen} />}
          subtitle="Campus & departmental"
        />

        <DashboardCard
          title="Unread Messages"
          count={7}
          color="yellow"
          icon={<MessageSquare className={styles.iconYellow} />}
          subtitle="Faculty & administration"
        />
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
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
      </div>

    </div>
  );
};

export default Dashboard;
