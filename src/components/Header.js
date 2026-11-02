import React from 'react';
import { Menu, GraduationCap, User, LogOut } from 'lucide-react';

export default function Header({ studentId, studentName, onOpenMenu, onLogout }) {
  return (
    <header className="topbar">
      <button type="button" className="topbar-menu-btn" onClick={onOpenMenu} aria-label="Open menu"><Menu size={22} /></button>
      <div className="topbar-text">
        <h1><GraduationCap size={22} className="topbar-cap" />Welcome{studentName ? `, ${studentName}` : ' Back'} to <span>Campus</span></h1>
        <p>Manage your courses, results, and personal information easily.</p>
      </div>
      <div className="topbar-actions">
        <div className="topbar-id"><User size={16} /><span>{studentId || 'Student'}</span></div>
        <button type="button" className="header-logout" onClick={onLogout} title="Logout" aria-label="Logout"><LogOut size={17} /></button>
      </div>
    </header>
  );
}
