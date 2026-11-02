import React from 'react';
import { X } from 'lucide-react';
import { NAV_ITEMS, LOGOUT_ITEM } from '../navConfig.js';
import logo from '../assets/MU.jpg';

export default function Sidebar({ activeTab, onNavigate, isOpen, onClose }) {
  return (
    <>
      {/* Backdrop only exists (and blocks clicks) on mobile while the drawer is open */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
        <div className="sidebar-top">
          <span className="sidebar-brand">Campus</span>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`sidebar-link ${activeTab === key ? 'is-active' : ''}`}
              onClick={() => onNavigate(key)}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-link sidebar-logout"
            onClick={() => onNavigate('logout')}
          >
            <LOGOUT_ITEM.icon size={18} strokeWidth={2} />
            <span>{LOGOUT_ITEM.label}</span>
          </button>

          <div className="sidebar-logo-card">
            <img src={logo} alt="Metropolitan University" />
          </div>
        </div>
      </aside>
    </>
  );
}
