import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  LogIn, 
  UserPlus,
  Sun,
  Moon
} from 'lucide-react';
import brandLogo from '../assets/careerpulse_logo.png';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  isSidebarCollapsed, 
  setIsSidebarCollapsed, 
  setAuthMode,
  theme = 'light',
  toggleTheme
}) {
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
        borderBottom: '1px solid var(--border-subtle)'
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
                src={brandLogo} 
                alt="CareerPulse AI Logo" 
                style={{
                  width: '2.4rem',
                  height: '2.4rem',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  boxShadow: '0 2px 10px rgba(23, 30, 25, 0.12)',
                  border: '1px solid var(--border-subtle)'
                }}
              />
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>CareerPulse</span>
                  <span style={{ color: '#171e19', fontWeight: 900 }}>AI</span>
                  <span style={{ color: '#ffe17c', fontSize: '1.35rem', lineHeight: 1 }}>.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Header actions based on page context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Quick Theme Switcher Pill (Presentation Light / Dark) */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="btn btn-outline btn-sm"
              title={theme === 'dark' ? 'Switch to Light Presentation Mode' : 'Switch to Dark Mode'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                borderColor: 'var(--border-card)',
                background: 'var(--bg-secondary)',
                fontSize: '0.78rem'
              }}
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={15} color="#ffe17c" />
                  <span style={{ fontWeight: 600 }}>Light UI</span>
                </>
              ) : (
                <>
                  <Moon size={15} color="#171e19" />
                  <span style={{ fontWeight: 600 }}>Dark UI</span>
                </>
              )}
            </button>
          )}

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
                  borderRadius: 'var(--radius-full)',
                  padding: '0.45rem 1.15rem'
                }}
              >
                <Sparkles size={15} color="#171e19" />
                <span>Go to Dashboard →</span>
              </button>
            ) : (
              <>
                {/* Sign Up Button (Pill in #171e19 charcoal with white text & yellow accent) */}
                <button 
                  className="btn btn-sm"
                  onClick={handleOpenRegister}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.45rem',
                    fontWeight: 700,
                    background: '#171e19',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.45rem 1.25rem',
                    boxShadow: '0 2px 8px rgba(23, 30, 25, 0.2)'
                  }}
                >
                  <UserPlus size={15} color="#ffe17c" />
                  <span>Sign Up</span>
                </button>

                {/* Log In Button (Text/Outline in #171e19) */}
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={handleOpenLogin}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.45rem',
                    borderColor: 'var(--border-card)',
                    color: '#171e19',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    padding: '0.45rem 1.15rem'
                  }}
                >
                  <LogIn size={15} color="#171e19" />
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
            /* Inside App Workspace: Status Badge */
            <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center' }}>
              <span className="badge badge-indigo" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}>
                <Sparkles size={13} />
                <span>Multi-Agent Active</span>
              </span>
            </div>
          ) : null}
        </div>

      </div>
    </header>
  );
}
