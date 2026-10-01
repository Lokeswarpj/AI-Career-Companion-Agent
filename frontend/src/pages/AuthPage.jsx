import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  X, 
  Key, 
  CheckCircle, 
  AlertCircle,
  Phone,
  GraduationCap,
  MapPin,
  Code2,
  Calendar,
  Building2,
  ArrowLeft
} from 'lucide-react';

const GOOGLE_OAUTH_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '887000506417-t38na8vq0j0qg13vih6dvutohrhh8ivi.apps.googleusercontent.com';

// Standard email format validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const isValidEmail = (val) => {
  if (!val || typeof val !== 'string') return false;
  return EMAIL_REGEX.test(val.trim());
};

// 10-digit mobile number validation regex
const PHONE_REGEX = /^\d{10}$/;
const isValidPhone = (val) => {
  if (!val || typeof val !== 'string') return false;
  return PHONE_REGEX.test(val.trim());
};

export default function AuthPage({ onSuccess, authMode = 'login', setAuthMode }) {
  const { login, register, googleLogin } = useAuth();
  const notify = useNotification();

  const [isRegister, setIsRegister] = useState(authMode === 'register');
  const [step, setStep] = useState('credentials'); // 'credentials' | 'onboarding'
  
  // Account Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Mandatory Profile Details State
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [degree, setDegree] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [location, setLocation] = useState('');
  const [technicalSkills, setTechnicalSkills] = useState('');

  // Field-level Error States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [universityError, setUniversityError] = useState('');
  const [degreeError, setDegreeError] = useState('');
  const [gradYearError, setGradYearError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [skillsError, setSkillsError] = useState('');
  const [modalEmailError, setModalEmailError] = useState('');

  // Google OAuth State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [customClientId, setCustomClientId] = useState(() => localStorage.getItem('cp_google_client_id') || GOOGLE_OAUTH_CLIENT_ID);
  const [pendingGooglePayload, setPendingGooglePayload] = useState(null);

  useEffect(() => {
    setIsRegister(authMode === 'register');
    setStep('credentials');
    clearAllErrors();
  }, [authMode]);

  const clearAllErrors = () => {
    setEmailError('');
    setPasswordError('');
    setFullNameError('');
    setPhoneError('');
    setUniversityError('');
    setDegreeError('');
    setGradYearError('');
    setLocationError('');
    setSkillsError('');
    setModalEmailError('');
  };

  // =========================================================================
  // 🔐 REAL-TIME LIVE PASSWORD STRENGTH EVALUATION ENGINE
  // =========================================================================
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const passedCriteriaCount = [hasMinLength, hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  const isPasswordStrong = passedCriteriaCount === 4;

  const getStrengthMetrics = () => {
    if (!password) return { label: '', color: 'transparent', percent: 0 };
    if (passedCriteriaCount === 4) return { label: 'Strong', color: '#10b981', percent: 100 };
    if (passedCriteriaCount === 3) return { label: 'Medium', color: '#eab308', percent: 75 };
    if (passedCriteriaCount === 2) return { label: 'Weak', color: '#f97316', percent: 50 };
    return { label: 'Very Weak', color: '#ef4444', percent: 25 };
  };

  const strength = getStrengthMetrics();

  // Initialize Google One Tap
  useEffect(() => {
    const activeClientId = customClientId || GOOGLE_OAUTH_CLIENT_ID;
    if (activeClientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId.trim(),
          callback: handleGoogleCredentialResponse,
          auto_select: false
        });
      } catch (err) {
        console.warn('Google Identity init notice:', err);
      }
    }
  }, [customClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    try {
      // Decode or verify profile from credential
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${response.credential}`);
      const payload = await verifyRes.json();
      const extractedEmail = payload.email?.toLowerCase()?.trim() || '';
      const extractedName = payload.name || payload.given_name || 'Student';

      // Auto-fill extracted Google Profile details
      setEmail(extractedEmail);
      setFullName(extractedName);
      setPendingGooglePayload({ credential: response.credential, userInfo: { email: extractedEmail, name: extractedName } });

      // Move to Mandatory Profile Onboarding Step
      setStep('onboarding');
      notify.success(`Google Account detected (${extractedEmail}). Please complete your required profile details to finish setup.`);
    } catch (err) {
      notify.error(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerNativeGoogleOAuth = (clientIdToUse) => {
    const activeClientId = clientIdToUse || customClientId || GOOGLE_OAUTH_CLIENT_ID;

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
              if (tokenResponse.error !== 'popup_closed_by_user') {
                notify.error(`Google notice: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }

            try {
              const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await profileRes.json();

              if (!profile.email || !isValidEmail(profile.email)) {
                throw new Error('Could not retrieve a valid email from selected Google account.');
              }

              const googleEmail = profile.email.toLowerCase().trim();
              const googleName = profile.name || profile.given_name || googleEmail.split('@')[0];

              // Auto-fill Name & Email directly from Google profile
              setEmail(googleEmail);
              setFullName(googleName);
              setPendingGooglePayload({
                userInfo: {
                  email: googleEmail,
                  name: googleName,
                  picture: profile.picture || ''
                }
              });

              // Prompt for remaining compulsory profile fields
              setStep('onboarding');
              setShowGoogleModal(false);
              notify.success(`Google profile verified for ${googleEmail}. Please fill in your mandatory profile details below.`);
            } catch (err) {
              console.error('Google profile processing error:', err);
              notify.error(err.message || 'Google authentication failed.');
            } finally {
              setGoogleLoading(false);
            }
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return true;
      } catch (err) {
        console.warn('Native Google OAuth popup error:', err);
        setGoogleLoading(false);
      }
    }
    return false;
  };

  const handleGoogleClick = () => {
    const activeClientId = customClientId || GOOGLE_OAUTH_CLIENT_ID;
    const triggered = triggerNativeGoogleOAuth(activeClientId);
    if (!triggered) {
      setGoogleEmailInput(email || '');
      setGoogleNameInput(fullName || '');
      setModalEmailError('');
      setShowGoogleModal(true);
    }
  };

  const handleModalGoogleSubmit = (e) => {
    e.preventDefault();
    setModalEmailError('');

    if (!googleEmailInput || !googleEmailInput.trim()) {
      setModalEmailError('Please enter your email ID.');
      return;
    }

    const emailVal = googleEmailInput.trim().toLowerCase();
    if (!isValidEmail(emailVal)) {
      setModalEmailError('Please enter a valid email ID.');
      return;
    }

    const nameVal = googleNameInput.trim() || emailVal.split('@')[0];
    setEmail(emailVal);
    setFullName(nameVal);
    setPendingGooglePayload({
      userInfo: {
        email: emailVal,
        name: nameVal,
        picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameVal)}`
      }
    });

    setShowGoogleModal(false);
    setStep('onboarding');
    notify.success(`Google email auto-filled (${emailVal}). Please complete compulsory profile details below.`);
  };

  // Step 1: Submit Credentials & Check Password Strength
  const handleProceedToOnboarding = (e) => {
    e.preventDefault();
    clearAllErrors();

    let hasError = false;
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError('Please enter your email ID.');
      hasError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email ID.');
      hasError = true;
    }

    if (!fullName.trim()) {
      setFullNameError('Please enter your full name.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please enter a password.');
      hasError = true;
    } else if (!isPasswordStrong) {
      setPasswordError('Password must be Strong! Make sure it has 8+ chars, letters, numbers, and a special char.');
      hasError = true;
    }

    if (hasError) return;

    // Password is strong and credentials valid -> Move to compulsory profile details step
    setStep('onboarding');
  };

  // Step 2: Final Compulsory Profile Registration Submission
  const handleFinalRegistrationSubmit = async (e) => {
    e.preventDefault();
    clearAllErrors();

    let hasError = false;

    // Validate Compulsory Fields marked with *
    if (!fullName.trim()) {
      setFullNameError('Full name is required.');
      hasError = true;
    }

    if (!email.trim() || !isValidEmail(email.trim())) {
      setEmailError('Valid email address is required.');
      hasError = true;
    }

    if (!phone.trim()) {
      setPhoneError('Mobile number is compulsory.');
      hasError = true;
    } else if (!isValidPhone(phone.trim())) {
      setPhoneError('Mobile number must be exactly 10 digits (e.g. 9876543210).');
      hasError = true;
    }

    if (!university.trim()) {
      setUniversityError('University / College name is compulsory.');
      hasError = true;
    }

    if (!degree.trim()) {
      setDegreeError('Degree & Branch is compulsory.');
      hasError = true;
    }

    const gradYearNum = parseInt(graduationYear);
    if (!graduationYear || isNaN(gradYearNum) || gradYearNum < 2020 || gradYearNum > 2035) {
      setGradYearError('Please select a valid graduation year.');
      hasError = true;
    }

    if (!location.trim()) {
      setLocationError('Current location / city is compulsory.');
      hasError = true;
    }

    if (!technicalSkills.trim()) {
      setSkillsError('Please enter at least 1-2 technical skills.');
      hasError = true;
    }

    if (hasError) {
      notify.error('Please fix all errors in compulsory fields marked with * before submitting.');
      return;
    }

    const parsedSkills = technicalSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const profileData = {
      phone: phone.trim(),
      university: university.trim(),
      degree: degree.trim(),
      graduation_year: gradYearNum,
      location: location.trim(),
      technical_skills: parsedSkills
    };

    setLoading(true);
    try {
      if (pendingGooglePayload) {
        // Register via Google OAuth with auto-filled Google profile + onboarding data
        await googleLogin({
          ...pendingGooglePayload,
          profileData
        });
        notify.success('Account created with Google & Profile saved successfully!');
      } else {
        // Register via Standard Email + Strong Password + Profile Data
        await register(email.trim().toLowerCase(), password, fullName.trim(), profileData);
        notify.success('Account created & Profile saved successfully! Welcome to CareerPulse AI.');
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      const errMsg = err.message || 'Registration failed.';
      if (errMsg.toLowerCase().includes('email')) {
        setEmailError(errMsg);
        setStep('credentials');
      } else if (errMsg.toLowerCase().includes('password')) {
        setPasswordError(errMsg);
        setStep('credentials');
      } else if (errMsg.toLowerCase().includes('mobile') || errMsg.toLowerCase().includes('phone')) {
        setPhoneError(errMsg);
      } else {
        notify.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Legacy / Direct Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearAllErrors();

    let hasError = false;
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setEmailError('Please enter your email ID.');
      hasError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email ID.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Please enter your password.');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await login(trimmedEmail, password);
      notify.success('Logged in successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      const errMsg = err.message || 'Login failed. Invalid credentials.';
      setPasswordError(errMsg);
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
          maxWidth: step === 'onboarding' ? '640px' : '480px',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
          transition: 'max-width 0.3s ease-in-out'
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
            {isRegister 
              ? (step === 'onboarding' ? 'Complete Your Profile' : 'Sign Up') 
              : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {isRegister 
              ? (step === 'onboarding' 
                  ? 'All fields marked with * are compulsory for AI Internship Matching' 
                  : 'Create an account to access live internships, skill gap analysis & mock prep')
              : 'Log in to access your AI career companion'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs (Only shown on Credentials Step) */}
        {step === 'credentials' && (
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
                setStep('credentials');
                clearAllErrors();
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
                setStep('credentials');
                clearAllErrors();
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
        )}

        {/* Continue with Google Button (Only on Step 1) */}
        {step === 'credentials' && (
          <>
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
          </>
        )}

        {/* STEP 1: CREDENTIALS FORM */}
        {step === 'credentials' && (
          <form onSubmit={isRegister ? handleProceedToOnboarding : handleLoginSubmit} noValidate>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Aarav Sharma"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fullNameError) setFullNameError('');
                    }}
                    style={{ 
                      paddingLeft: '2.5rem',
                      borderColor: fullNameError ? '#ef4444' : undefined,
                      boxShadow: fullNameError ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined
                    }}
                    required
                  />
                  <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: fullNameError ? '#ef4444' : 'var(--text-muted)' }} />
                </div>
                {fullNameError && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{fullNameError}</span>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com (Gmail, Outlook, College Mail)"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  style={{ 
                    paddingLeft: '2.5rem',
                    borderColor: emailError ? '#ef4444' : undefined,
                    boxShadow: emailError ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined
                  }}
                  required
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: emailError ? '#ef4444' : 'var(--text-muted)' }} />
              </div>
              {emailError && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  style={{ 
                    paddingLeft: '2.5rem',
                    paddingRight: '2.75rem',
                    borderColor: passwordError ? '#ef4444' : undefined,
                    boxShadow: passwordError ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined
                  }}
                  required
                />
                <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: passwordError ? '#ef4444' : 'var(--text-muted)' }} />
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
                    color: showPassword ? 'var(--accent-cyan)' : 'var(--text-muted)'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* 📊 REAL-TIME LIVE PASSWORD STRENGTH INDICATOR (SIGN UP ONLY) */}
              {isRegister && password && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Password Strength:</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>

                  {/* Strength Bar */}
                  <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                    <div style={{ height: '100%', width: `${strength.percent}%`, background: strength.color, transition: 'all 0.3s ease' }} />
                  </div>

                  {/* Requirements Checklist */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.74rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasMinLength ? '#10b981' : 'var(--text-muted)' }}>
                      {hasMinLength ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                      <span>8+ Characters</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasLetter ? '#10b981' : 'var(--text-muted)' }}>
                      {hasLetter ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                      <span>Letters (A-Z)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasNumber ? '#10b981' : 'var(--text-muted)' }}>
                      {hasNumber ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                      <span>Numbers (0-9)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: hasSpecial ? '#10b981' : 'var(--text-muted)' }}>
                      {hasSpecial ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                      <span>Special (@,$,!,%,*)</span>
                    </div>
                  </div>
                </div>
              )}

              {passwordError && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (isRegister && !isPasswordStrong)}
              className="btn btn-primary"
              style={{ 
                width: '100%', 
                marginTop: '1.25rem', 
                padding: '0.8rem', 
                gap: '0.5rem',
                opacity: (isRegister && !isPasswordStrong) ? 0.6 : 1,
                cursor: (isRegister && !isPasswordStrong) ? 'not-allowed' : 'pointer'
              }}
            >
              <span>
                {loading 
                  ? 'Authenticating...' 
                  : isRegister 
                    ? (isPasswordStrong ? 'Proceed to Compulsory Profile Setup →' : 'Enter a Strong Password to Continue')
                    : 'Log In to Dashboard'}
              </span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: COMPULSORY PROFILE DETAILS ONBOARDING FORM */}
        {step === 'onboarding' && (
          <form onSubmit={handleFinalRegistrationSubmit} noValidate>
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '12px',
              padding: '0.9rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <CheckCircle size={20} color="#6366f1" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {pendingGooglePayload ? (
                  <span>Google Account connected: <strong>{email}</strong>. Please complete compulsory details below.</span>
                ) : (
                  <span>Account credentials verified. Complete compulsory details below to launch dashboard.</span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Full Name * */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); if (fullNameError) setFullNameError(''); }}
                    placeholder="Full Name"
                    style={{ paddingLeft: '2.5rem', borderColor: fullNameError ? '#ef4444' : undefined }}
                    required
                  />
                  <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {fullNameError && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{fullNameError}</span>}
              </div>

              {/* Mobile Number * (10 Digits Compulsory) */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Mobile Number (10 Digits Compulsory) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    maxLength={10}
                    className="form-input"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPhone(val);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="e.g. 9876543210 (10 Digits)"
                    style={{ 
                      paddingLeft: '2.5rem', 
                      borderColor: phoneError ? '#ef4444' : (isValidPhone(phone) ? '#10b981' : undefined),
                      boxShadow: phoneError ? '0 0 0 2px rgba(239, 68, 68, 0.25)' : undefined
                    }}
                    required
                  />
                  <Phone size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: phoneError ? '#ef4444' : 'var(--text-muted)' }} />
                </div>
                {phoneError ? (
                  <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertCircle size={13} /> {phoneError}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    {phone.length}/10 digits entered {isValidPhone(phone) ? '✓ Valid' : ''}
                  </span>
                )}
              </div>

              {/* University / College * */}
              <div className="form-group">
                <label className="form-label">
                  University / College <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={university}
                    onChange={(e) => { setUniversity(e.target.value); if (universityError) setUniversityError(''); }}
                    placeholder="e.g. IIT Bombay / NIT"
                    style={{ paddingLeft: '2.3rem', borderColor: universityError ? '#ef4444' : undefined }}
                    required
                  />
                  <Building2 size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {universityError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{universityError}</span>}
              </div>

              {/* Degree & Branch * */}
              <div className="form-group">
                <label className="form-label">
                  Degree & Branch <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={degree}
                    onChange={(e) => { setDegree(e.target.value); if (degreeError) setDegreeError(''); }}
                    placeholder="e.g. B.Tech CS"
                    style={{ paddingLeft: '2.3rem', borderColor: degreeError ? '#ef4444' : undefined }}
                    required
                  />
                  <GraduationCap size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {degreeError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{degreeError}</span>}
              </div>

              {/* Graduation Year * */}
              <div className="form-group">
                <label className="form-label">
                  Graduation Year <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-input"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    style={{ paddingLeft: '2.3rem' }}
                    required
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                  <Calendar size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Current Location / City * */}
              <div className="form-group">
                <label className="form-label">
                  Current City <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); if (locationError) setLocationError(''); }}
                    placeholder="e.g. Bengaluru, India"
                    style={{ paddingLeft: '2.3rem', borderColor: locationError ? '#ef4444' : undefined }}
                    required
                  />
                  <MapPin size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {locationError && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{locationError}</span>}
              </div>

              {/* Technical Skills * */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Primary Technical Skills (Comma-separated) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={technicalSkills}
                    onChange={(e) => { setTechnicalSkills(e.target.value); if (skillsError) setSkillsError(''); }}
                    placeholder="e.g. React, Node.js, Python, SQL, Git"
                    style={{ paddingLeft: '2.5rem', borderColor: skillsError ? '#ef4444' : undefined }}
                    required
                  />
                  <Code2 size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                {skillsError && <span style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>{skillsError}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 1rem', gap: '0.4rem' }}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.75rem', gap: '0.5rem', fontWeight: 700 }}
              >
                <span>{loading ? 'Completing Registration...' : 'Complete Profile & Launch Dashboard →'}</span>
              </button>
            </div>
          </form>
        )}

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
              overflow: 'hidden'
            }}
          >
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
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>to auto-fill your profile data</p>
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
              <form onSubmit={handleModalGoogleSubmit} noValidate>
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Google Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={googleEmailInput}
                    onChange={(e) => {
                      setGoogleEmailInput(e.target.value);
                      if (modalEmailError) setModalEmailError('');
                    }}
                    placeholder="yourname@gmail.com"
                    required
                    style={{ fontSize: '0.85rem', padding: '0.65rem 0.8rem' }}
                  />
                  {modalEmailError && (
                    <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertCircle size={14} />
                      <span>{modalEmailError}</span>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    placeholder="Your Name"
                    style={{ fontSize: '0.85rem', padding: '0.65rem 0.8rem' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.7rem', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Auto-Fill Details & Continue →
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
