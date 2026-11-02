import React from 'react';
import Login from './components/Login';
import ProtectedApp from './components/ProtectedApp';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function AppContent() {
  const { loading, isAuthenticated } = useAuth();  
  if (loading) return <div className="app-loading"><div className="loading-spinner" /><span>Loading your session…</span></div>;
  return isAuthenticated ? <ProtectedApp /> : <Login />;
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
