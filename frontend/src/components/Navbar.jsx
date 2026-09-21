import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  LogIn, 
  UserPlus, 
  Menu
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isSidebarCollapsed, setIsSidebarCollapsed, setAuthMode }) {
  const { isAuthenticated } = useAuth();

  const isLanding = activeTab === 'landing';
  const isAuth = activeTab === 'auth';

  const tabTitles = {
    landing: 'Platform Overview',
    auth: 'Authentication',
    dashboard: 'Student Command Center',
    resume: 'Resume Intelligence Center',
    internships: 'Curated Opportunities (180 Postings)',
    matching: 'Job-Resume Matching Agent',
    'skill-gap': 'Skill Gap Analysis & Roadmaps',
    customizer: 'Resume & Cover Letter Customizer',
    'mock-interview': 'AI Mock Interview Coach',
    history: 'Interview Performance Logs',
    assistant: 'Conversational Career Assistant',
    profile: 'Student Profile & Skills'
  };

  const handleOpenLogin = () => {
    if (setAuthMode) setAuthMode('login');
    setActiveTab('auth');
  };

  const handleOpenRegister = () => {
    if (setAuthMode) setAuthMode('register');
    setActiveTab('auth');
  };

  return (
    <header 
      className="glass-nav" 
      style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 900, 
        height: '4.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      <div 
        className="container" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          height: '100%',
          maxWidth: '1400px'
        }}
      >
        {/* Left Side: Brand Logo (on Landing/Auth) OR Sidebar Toggle + Section (Inside App) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isLanding || isAuth ? (
            /* Brand Logo on Landing/Auth */
            <div 
              onClick={() => setActiveTab('landing')} 
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
          ) : (
            /* Inside App Workspace: Menu Toggle + Section Badge */
            <>
              {isAuthenticated && (
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(255, 255, 255, 0.05)'
                  }}
                  title={isSidebarCollapsed ? 'Expand left sidebar' : 'Minimize left sidebar'}
                >
                  <Menu size={16} color="#818cf8" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    {isSidebarCollapsed ? 'Expand' : 'Menu'}
                  </span>
                </button>
              )}

              <span style={{
                fontSize: '0.84rem',
                color: 'var(--text-secondary)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Section:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{tabTitles[activeTab] || 'Dashboard'}</strong>
              </span>
            </>
          )}
        </div>

        {/* Right Side: Header actions based on page context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isLanding ? (
            <>
              {/* Sign Up Button (Left of Log In) */}
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleOpenRegister}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.45rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)'
                }}
              >
                <UserPlus size={15} />
                <span>Sign Up</span>
              </button>

              {/* Log In Button (Right of Sign Up) */}
              <button 
                className="btn btn-outline btn-sm"
                onClick={handleOpenLogin}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.45rem',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  fontWeight: 600
                }}
              >
                <LogIn size={15} color="#818cf8" />
                <span>Log In</span>
              </button>
            </>
          ) : isAuth ? (
            /* On Login / Sign Up page: Just show Back to Overview link */
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('landing')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <span>← Back to Overview</span>
            </button>
          ) : isAuthenticated ? (
            <>
              {/* Inside App Workspace: Status Badge */}
              <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center' }}>
                <span className="badge badge-indigo" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                  <Sparkles size={13} />
                  <span>Multi-Agent Active</span>
                </span>
              </div>

              {/* Switch Account Button */}
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleOpenLogin}
                title="Log in with another account"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}
              >
                <LogIn size={14} color="#818cf8" />
                <span>Switch Account</span>
              </button>
            </>
          ) : null}
        </div>

      </div>
    </header>
  );
}
