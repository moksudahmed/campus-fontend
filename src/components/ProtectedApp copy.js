import React, { useEffect, useState } from 'react';
import { BookOpen, BarChart3, FileText, Settings, LogOut, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import Profile from './Profile';
import Results from './Results';
import Courses from './Courses';
import Placeholder from './Placeholder';
import { stats } from '../studentData';
import { useAuth } from '../context/AuthContext';
import TokenService from '../services/tokenService';
import AcademicPerformance from './AcademicPerformance';
import Setting from './Settings';

const PANEL_COPY = {
  courses: { icon: BookOpen, title: 'Courses', message: 'Your enrolled courses for this semester will appear here once registration opens.' },
  performance: { icon: BarChart3, title: 'Academic Performance', message: 'Grade trends and CGPA history will be shown here after your first results are published.' },
  results: { icon: FileText, title: 'Results', message: 'Semester results will be listed here as soon as they are released by the registrar.' },
  settings: { icon: Settings, title: 'Settings', message: 'Account, notification and password preferences will live here.' },
};

export default function ProtectedApp() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth > 900) setSidebarOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = async (key) => {
    if (key !== 'logout') {
      setActiveTab(key);
      setSidebarOpen(false);
      return;
    }
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const renderPanel = () => {    
    if (activeTab === 'dashboard') return <Dashboard stats={stats} student={user}/>;
    if (activeTab === 'profile') return <Profile student_id={user} token={TokenService.getAccessToken()}/>;
    if (activeTab === 'results') return <Results student_id={user} token={TokenService.getAccessToken()}/>;
    if (activeTab === 'courses') return <Courses student_id={user} token={TokenService.getAccessToken()}/>;
    if (activeTab === 'performance') return <AcademicPerformance student_id={user} token={TokenService.getAccessToken()}/>;  
    if (activeTab === 'settings') return <Setting student_id={user} token={TokenService.getAccessToken()}/>;  
    
    const copy = PANEL_COPY[activeTab];
    return copy ? <Placeholder {...copy} /> : null;
  };

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onNavigate={handleNavigate} isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Header studentId={user?.studentId || user?.id || user?.loginId} studentName={user}
          onOpenMenu={() => setSidebarOpen(true)} onLogout={() => handleNavigate('logout')} />
        <main className="app-content">{renderPanel()}</main>
        <footer className="app-footer">&copy; {new Date().getFullYear()} Metropolitan University. All rights reserved.</footer>
      </div>
      {loggingOut && <div className="logout-overlay"><div className="logout-dialog">Signing out…</div></div>}
    </div>
  );
}
