import {
  Home,
  BookOpen,
  BarChart3,
  FileText,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

// Single source of truth for the sidebar links + which panel each one opens.
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'courses', label: 'Courses', icon: BookOpen },
  { key: 'performance', label: 'Academic Performance', icon: BarChart3 },
  { key: 'results', label: 'Results', icon: FileText },
  { key: 'subject-registration', label: 'Subject Registration', icon: BookOpen }, 
  { key: 'profile', label: 'Profile', icon: User },  
  { key: 'settings', label: 'Settings', icon: Settings },
];

export const LOGOUT_ITEM = { key: 'logout', label: 'Logout', icon: LogOut };
