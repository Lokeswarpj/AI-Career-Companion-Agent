import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  LogIn, 
  UserPlus 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isSidebarCollapsed, setIsSidebarCollapsed, setAuthMode }) {
  const { isAuthenticated } = useAuth();

  const isLanding = activeTab === 'landing';
  const isAuth = activeTab === 'auth';

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
        {/* Left Side: Brand Logo (on Landing/Auth) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {(isLanding || isAuth) && (
            <div 
              onClick={() => setActiveTab('landing')} 
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
            >
              <img 
                src="/careerpulse_logo.png" 
                alt="CareerPulse AI Logo" 
                style={{
                  width: '2.4rem',
                  height: '2.4rem',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  boxShadow: '0 0 14px rgba(99, 102, 241, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              />
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>CareerPulse</span>
                  <span className="gradient-text">AI</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Header actions based on page context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isLanding ? (
            isAuthenticated ? (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('dashboard')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.45rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)'
                }}
              >
                <Sparkles size={15} />
                <span>Go to Dashboard →</span>
              </button>
            ) : (
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
            )
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
