import React from "react";
import { BookOpen, Calendar, MessageSquare } from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import ActivityCard from "../components/ActivityCard";

const Dashboard = () => (
  <div className="space-y-10 p-6">
    {/* Top Section - Stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <DashboardCard
        title="Courses"
        count={5}
        color="indigo"
        icon={<BookOpen className="w-8 h-8 text-indigo-600" />}
      />
      <DashboardCard
        title="Events"
        count={3}
        color="green"
        icon={<Calendar className="w-8 h-8 text-green-600" />}
      />
      <DashboardCard
        title="Messages"
        count={7}
        color="yellow"
        icon={<MessageSquare className="w-8 h-8 text-yellow-600" />}
      />
    </div>

    {/* Recent Activities */}
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
        Recent Activities
      </h2>
      <div className="space-y-3">
        <ActivityCard
          activity="📘 Submitted Assignment for Math"
          date="Sept 23"
        />
        <ActivityCard
          activity="🎉 Joined Science Club Event"
          date="Sept 21"
        />
        <ActivityCard
          activity="✉️ New Message from Advisor"
          date="Sept 20"
        />
      </div>
    </div>
  </div>
);

export default Dashboard;
