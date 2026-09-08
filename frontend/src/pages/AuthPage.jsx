import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Sparkles, Lock, Mail, User, ArrowRight, ShieldCheck, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AuthPage({ onSuccess }) {
  const { login, sendRegistrationOtp, verifyOtpRegister, resendOtp } = useAuth();
  const notify = useNotification();

  const [isRegister, setIsRegister] = useState(false);
  const [regStep, setRegStep] = useState('form'); // 'form' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP State
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [previewOtp, setPreviewOtp] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const otpInputsRef = useRef([]);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (regStep === 'otp' && otpInputsRef.current[0]) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [regStep]);

  // Handle Sign In or Step 1 of Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      notify.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        if (!fullName) {
          notify.error('Please enter your full name.');
          setLoading(false);
          return;
        }

        const res = await sendRegistrationOtp(email, password, fullName);
        notify.success(`Verification code sent to ${email}!`);
        if (res.previewOtp) {
          setPreviewOtp(res.previewOtp);
        }
        setResendCooldown(60);
        setRegStep('otp');
      } else {
        await login(email, password);
        notify.success('Logged in successfully!');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      notify.error(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle backspace and keyboard navigation in OTP inputs
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Handle paste for full 6-digit OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  // Handle Step 2 OTP Verification & Account Creation
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('').trim();
    if (fullOtp.length !== 6) {
      notify.error('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtpRegister(email, fullOtp);
      notify.success('Email verified successfully! Welcome to CareerPulse AI.');
      if (onSuccess) onSuccess();
    } catch (err) {
      notify.error(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    try {
      const res = await resendOtp(email);
      notify.success('A fresh verification code has been dispatched to your email.');
      if (res.previewOtp) {
        setPreviewOtp(res.previewOtp);
      }
      setResendCooldown(60);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err) {
      notify.error(err.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  // Autofill OTP helper
  const handleAutofillPreviewOtp = () => {
    if (previewOtp && previewOtp.length === 6) {
      setOtpDigits(previewOtp.split(''));
      notify.info('Verification code autofilled!');
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
          <div style={{
            width: '3.2rem',
            height: '3.2rem',
            borderRadius: '14px',
            background: regStep === 'otp' 
              ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' 
              : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-cyan) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: 'var(--shadow-glow)'
          }}>
            {regStep === 'otp' ? <KeyRound size={24} color="#ffffff" /> : <Sparkles size={24} color="#ffffff" />}
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {regStep === 'otp' 
              ? 'Verify Your Email' 
              : isRegister 
                ? 'Create Account' 
                : 'Welcome Back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {regStep === 'otp'
              ? `Enter the 6-digit code sent to ${email}`
              : isRegister 
                ? 'Join with your email to discover personalized internships and AI mock prep'
                : 'Sign in to access your career companion and mock sessions'}
          </p>
        </div>

        {/* Mode Toggle Tabs (Shown only when in initial form) */}
        {regStep === 'form' && (
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
              onClick={() => setIsRegister(false)}
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
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
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
              Register
            </button>
          </div>
        )}

        {/* STEP 1: Standard Credentials Form */}
        {regStep === 'form' && (
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
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                  minLength={6}
                />
                <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.8rem', gap: '0.5rem' }}
            >
              <span>
                {loading 
                  ? 'Processing...' 
                  : isRegister 
                    ? 'Continue & Send OTP' 
                    : 'Sign In to Dashboard'}
              </span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: 6-Digit Email OTP Verification Screen */}
        {regStep === 'otp' && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                <Mail size={18} color="#10b981" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {email}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRegStep('form')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  flexShrink: 0
                }}
              >
                <ArrowLeft size={13} /> Edit
              </button>
            </div>

            {/* Dev Mode Sandbox Notice / One-Click Autofill (if present) */}
            {previewOtp && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.82rem',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} color="#818cf8" />
                  <span>Sandbox Code: <strong style={{ color: '#ffffff', letterSpacing: '2px' }}>{previewOtp}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleAutofillPreviewOtp}
                  style={{
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Autofill
                </button>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="form-label" style={{ textAlign: 'center', marginBottom: '0.75rem', display: 'block' }}>
                Enter 6-Digit Code
              </label>
              <div 
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '3rem',
                      height: '3.6rem',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      background: digit ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary)',
                      border: digit ? '2px solid var(--accent-primary)' : '1px solid var(--border-card)',
                      borderRadius: '10px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxShadow: digit ? '0 0 12px rgba(99, 102, 241, 0.3)' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otpDigits.join('').length !== 6}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                gap: '0.5rem',
                opacity: (loading || otpDigits.join('').length !== 6) ? 0.7 : 1
              }}
            >
              <CheckCircle2 size={18} />
              <span>{loading ? 'Verifying Code...' : 'Verify & Create Account'}</span>
            </button>

            {/* Resend Code Footer */}
            <div style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <span>Didn't receive the email? </span>
              {resendCooldown > 0 ? (
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                  Resend code in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Security Badge */}
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
          <span>Encrypted OTP verification & bcrypt 10-round salted hash</span>
        </div>

      </div>
    </div>
  );
}
