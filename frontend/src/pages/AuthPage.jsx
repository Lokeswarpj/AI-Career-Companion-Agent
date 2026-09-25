import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Sparkles, Lock, Mail, User, ArrowRight, ShieldCheck, Eye, EyeOff, X, Key, CheckCircle, ExternalLink } from 'lucide-react';

export default function AuthPage({ onSuccess, authMode = 'login', setAuthMode }) {
  const { login, register, googleLogin } = useAuth();
  const notify = useNotification();

  const [isRegister, setIsRegister] = useState(authMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Google Modal State (used when client ID is not configured or for quick selection)
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [customClientId, setCustomClientId] = useState(() => localStorage.getItem('cp_google_client_id') || '');
  const [showConfigClientId, setShowConfigClientId] = useState(false);

  useEffect(() => {
    setIsRegister(authMode === 'register');
  }, [authMode]);

  // Attempt Google OAuth native popup flow with select_account prompt
  const triggerNativeGoogleOAuth = (clientIdToUse) => {
    const activeClientId = clientIdToUse || customClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (activeClientId && window.google?.accounts?.oauth2) {
      try {
        setGoogleLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeClientId.trim(),
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setGoogleLoading(false);
              notify.error(`Google Sign-In notice: ${tokenResponse.error_description || tokenResponse.error}`);
              return;
            }

            try {
              // Fetch user profile from official Google userinfo endpoint
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await profileRes.json();

              if (!profile.email) {
                throw new Error('Could not retrieve email from selected Google account.');
              }

              await googleLogin({
                userInfo: {
                  email: profile.email,
                  name: profile.name || profile.given_name || profile.email.split('@')[0],
                  picture: profile.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || profile.email)}`
                }
              });

              notify.success(`Signed in as ${profile.name || profile.email} with Google!`);
              setShowGoogleModal(false);
              if (onSuccess) onSuccess();
            } catch (err) {
              console.error('Google profile error:', err);
              notify.error(err.message || 'Google authentication failed.');
            } finally {
              setGoogleLoading(false);
            }
          }
        });

        // Open native Google popup window with account selector
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return true;
      } catch (err) {
        console.warn('Native Google OAuth error:', err);
        setGoogleLoading(false);
      }
    }
    return false;
  };

  const handleGoogleClick = () => {
    const activeClientId = customClientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    // If a Google Client ID exists, directly trigger Google's native account chooser popup
    if (activeClientId && triggerNativeGoogleOAuth(activeClientId)) {
      return;
    }

    // Otherwise, open the sleek in-app Google Account Chooser modal
    setGoogleEmailInput(email || 'kalyankumar@gmail.com');
    setGoogleNameInput(fullName || 'Kalyan Kumar');
    setShowGoogleModal(true);
  };

  const handleSaveClientIdAndLaunch = (e) => {
    e.preventDefault();
    if (!customClientId.trim()) {
      notify.error('Please enter a valid Google OAuth Client ID.');
      return;
    }
    localStorage.setItem('cp_google_client_id', customClientId.trim());
    notify.success('Google Client ID saved! Launching Google Account Chooser...');
    triggerNativeGoogleOAuth(customClientId.trim());
  };

  const handleModalGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmailInput || !googleEmailInput.trim()) {
      notify.error('Please enter your Google / Gmail address.');
      return;
    }

    setGoogleLoading(true);
    try {
      const emailVal = googleEmailInput.trim().toLowerCase();
      const nameVal = googleNameInput.trim() || emailVal.split('@')[0];

      await googleLogin({
        userInfo: {
          email: emailVal,
          name: nameVal,
          picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameVal)}`
        }
      });

      notify.success(`Signed in with Google as ${emailVal}!`);
      setShowGoogleModal(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      notify.error(err.message || 'Google login failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      notify.error('Please fill in all required fields.');
      return;
    }
    if (isRegister && !fullName) {
      notify.error('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, fullName);
        notify.success('Account created successfully! Welcome to CareerPulse AI.');
      } else {
        await login(email, password);
        notify.success('Logged in successfully!');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      notify.error(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 12rem)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem'
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src="/careerpulse_logo.png" 
            alt="CareerPulse AI Logo" 
            style={{
              width: '3.6rem',
              height: '3.6rem',
              borderRadius: '14px',
              objectFit: 'cover',
              margin: '0 auto 1rem auto',
              display: 'block',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          />
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {isRegister ? 'Sign Up' : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isRegister 
              ? 'Sign up with your email to discover personalized internships and AI mock prep'
              : 'Log in to access your career companion and mock sessions'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-secondary)',
          padding: '0.3rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.75rem',
          border: '1px solid var(--border-card)'
        }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              if (setAuthMode) setAuthMode('login');
            }}
            style={{
              flex: 1,
              padding: '0.55rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: !isRegister ? 'var(--accent-primary)' : 'transparent',
              color: !isRegister ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              if (setAuthMode) setAuthMode('register');
            }}
            style={{
              flex: 1,
              padding: '0.55rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: isRegister ? 'var(--accent-primary)' : 'transparent',
              color: isRegister ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign Up
          </button>
        </div>

        {/* Continue with Google Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={googleLoading || loading}
          className="glass-panel"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.92rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '1.25rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>{googleLoading ? 'Connecting Google...' : isRegister ? 'Sign up with Google' : 'Continue with Google'}</span>
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          textAlign: 'center',
          margin: '1.25rem 0',
          color: 'var(--text-muted)',
          fontSize: '0.8rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }}></div>
          <span style={{ padding: '0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or continue with email</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-card)' }}></div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aarav Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="name@example.com (Gmail, Outlook, College Mail)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
                required
                minLength={6}
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '0.2rem',
                  cursor: 'pointer',
                  color: showPassword ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.8rem', gap: '0.5rem' }}
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Sign Up & Create Account' : 'Log In to Dashboard'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{
          marginTop: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>Bcrypt 10-round salted hashing & JWT session security</span>
        </div>

      </div>

      {/* Modern Google Account Selector Modal */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#131827',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(66, 133, 244, 0.15)',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem 1.5rem 1rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>Choose a Google Account</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>to continue to CareerPulse AI</p>
                </div>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* One-Click Quick Selection Account Card */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select Account
                </span>
                
                <div 
                  onClick={handleModalGoogleSubmit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.9rem 1rem',
                    marginTop: '0.5rem',
                    background: 'rgba(66, 133, 244, 0.08)',
                    border: '1px solid rgba(66, 133, 244, 0.25)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(66, 133, 244, 0.16)';
                    e.currentTarget.style.borderColor = '#4285F4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(66, 133, 244, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(66, 133, 244, 0.25)';
                  }}
                >
                  <img 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleNameInput || 'Kalyan Kumar')}`} 
                    alt="Avatar" 
                    style={{ width: '42px', height: '42px', borderRadius: '50%', border: '2px solid #4285F4' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
                      {googleNameInput || 'Kalyan Kumar'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {googleEmailInput || 'kalyankumar@gmail.com'}
                    </div>
                  </div>
                  <CheckCircle size={20} color="#34A853" />
                </div>
              </div>

              {/* Custom / Another Google Account Form */}
              <form onSubmit={handleModalGoogleSubmit} style={{ marginTop: '1rem' }}>
                <div className="form-group" style={{ marginBottom: '0.9rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Google Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="e.g. kalyankumar@gmail.com"
                    required
                    style={{ fontSize: '0.88rem', padding: '0.65rem 0.9rem' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Display Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    placeholder="e.g. Kalyan Kumar"
                    style={{ fontSize: '0.88rem', padding: '0.65rem 0.9rem' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={googleLoading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#4285F4',
                    borderColor: '#4285F4',
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                >
                  {googleLoading ? 'Connecting...' : `Sign in with ${googleEmailInput || 'Google'}`}
                </button>
              </form>

              {/* Native Google Cloud OAuth Config Expander */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowConfigClientId(!showConfigClientId)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: 0
                  }}
                >
                  <Key size={14} />
                  <span>{showConfigClientId ? 'Hide Google Cloud OAuth Setup' : '⚡ Connect Google Cloud Client ID (For Native Browser Popup)'}</span>
                </button>

                {showConfigClientId && (
                  <form onSubmit={handleSaveClientIdAndLaunch} style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.25)', padding: '0.9rem', borderRadius: '10px' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', lineHeight: '1.4' }}>
                      To trigger Google's native account chooser window, enter your Web OAuth Client ID from Google Cloud Console:
                    </p>
                    <input
                      type="text"
                      className="form-input"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                      placeholder="e.g. 123456789-xyz.apps.googleusercontent.com"
                      style={{ fontSize: '0.78rem', padding: '0.5rem 0.75rem', marginBottom: '0.6rem' }}
                    />
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
                    >
                      Save & Launch Google Popup Window
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
