import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Compass, 
  FileText, 
  Briefcase, 
  Sparkles, 
  Mic, 
  History, 
  MessageSquare, 
  User, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'internships', label: 'Find Internships', icon: Briefcase },
    { id: 'matching', label: 'AI Matching', icon: Sparkles },
    { id: 'resume', label: 'Resume AI', icon: FileText },
    { id: 'mock-interview', label: 'Mock Interview', icon: Mic },
    { id: 'history', label: 'Performance', icon: History },
    { id: 'assistant', label: 'Career Assistant', icon: MessageSquare },
  ];

  return (
    <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4.25rem' }}>
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab(isAuthenticated ? 'dashboard' : 'landing')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '2.4rem',
            height: '2.4rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-cyan) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>CareerPulse</span>
              <span className="gradient-text">AI</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '-3px' }}>
              Infosys Virtual Internship Project
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} className="desktop-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: isActive ? '#818cf8' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }} className="desktop-nav">
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('landing')}
            >
              Overview
            </button>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('auth')}
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* User Profile / Auth State & Mobile Menu Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('profile')}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                title="View & Edit Profile"
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#ffffff'
                }}>
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.full_name?.split(' ')[0] || 'Profile'}
                </span>
              </button>
              
              <button
                onClick={logout}
                className="btn btn-outline btn-sm"
                title="Logout"
                style={{ padding: '0.45rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && isAuthenticated && (
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-card)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: isActive ? '#818cf8' : 'var(--text-primary)',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
