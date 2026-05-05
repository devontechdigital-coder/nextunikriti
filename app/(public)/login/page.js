'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/redux/slices/authSlice';
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneDisplay,
  formatPhoneInput,
  normalizePhoneNumber,
  PHONE_COUNTRY_OPTIONS,
} from '@/lib/phone';

export default function LoginPage() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('student');
  const [mounted, setMounted] = useState(false);

  // Student State
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [hash, setHash] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');

  // Instructor/Admin State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [loginSignupEnabled, setLoginSignupEnabled] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const normalizedPhone = normalizePhoneNumber(phone, phoneCountry);

  useEffect(() => {
    setMounted(true);

    const loadSettings = async () => {
      try {
        const res = await axios.get('/api/settings');
        setLoginSignupEnabled(res.data?.data?.login_signup_enabled ?? true);
      } catch {
        setLoginSignupEnabled(true);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!normalizedPhone) { setError('Enter a valid phone number for the selected country'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/send-otp', { phone: normalizedPhone, country: phoneCountry });
      if (res.data.success) {
        setHash(res.data.data.hash);
        setSubmittedPhone(res.data.data.phone || normalizedPhone);
        setOtpSent(true);
        setSuccess('OTP sent successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const otpValue = otpDigits.join('');
    try {
      const res = await axios.post('/api/auth/verify-otp', {
        phone: submittedPhone || normalizedPhone,
        hash,
        otp: otpValue,
        country: phoneCountry,
      });
      if (res.data.success) window.location.href = '/student/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data;
        dispatch(setCredentials(userData));
        const role = userData.role;
        if (role === 'admin' || role === 'sub_admin') window.location.href = '/admin';
        else if (role === 'school_admin') window.location.href = '/school/dashboard';
        else window.location.href = '/instructor';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigit = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setOtpDigits(next);
    document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
  };

  const otpComplete = otpDigits.every(d => d !== '');

  return (
    <>
     

      <div className="lp-root">
        <div className={`lp-card ${mounted ? 'mounted' : ''}`}>

         
          <h1 className="lp-heading">
            {activeTab === 'student' ? 'Welcome back' : 'Staff access'}
          </h1>
          <p className="lp-subheading">
            {activeTab === 'student' ? 'Sign in with your phone number' : 'Sign in with your credentials'}
          </p>

          {/* Alerts */}
          {error && (
            <div className="lp-alert lp-alert-error">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 0a7 7 0 100 14A7 7 0 007 0zm0 10.5a.875.875 0 110-1.75.875.875 0 010 1.75zm.875-3.5h-1.75V3.5h1.75V7z" />
              </svg>
              {error}
            </div>
          )}
          {success && !otpSent && (
            <div className="lp-alert lp-alert-success">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 7l3.5 3.5L12 4" strokeLinecap="round" />
              </svg>
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="lp-tabs">
            <button className={`lp-tab ${activeTab === 'student' ? 'active' : ''}`} onClick={() => handleTabSwitch('student')}>
              Student
            </button>
            <button className={`lp-tab ${activeTab === 'instructor' ? 'active' : ''}`} onClick={() => handleTabSwitch('instructor')}>
              Staff login
            </button>
          </div>

          {/* STUDENT PANEL */}
          {activeTab === 'student' && (
            <div>
              <div className="lp-step-bar">
                <div className={`lp-step-dot ${!otpSent ? 'active' : ''}`} />
                <div className={`lp-step-dot ${otpSent ? 'active' : ''}`} />
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOTP}>
                  <div className="lp-field">
                    <label className="lp-label">Phone number</label>
                    <div className="lp-phone-row">
                      <select className="lp-select" value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}>
                        {PHONE_COUNTRY_OPTIONS.map((opt) => (
                          <option key={opt.code} value={opt.code}>{opt.label}</option>
                        ))}
                      </select>
                      <input
                        className="lp-input"
                        type="tel"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(formatPhoneInput(e.target.value, phoneCountry))}
                        required
                      />
                    </div>
                    <p className="lp-hint">We&apos;ll send a one-time code to this number.</p>
                    {!loginSignupEnabled && (
                      <p className="lp-hint">New signup is currently blocked. Existing students can still sign in.</p>
                    )}
                  </div>
                  <button className="lp-btn lp-btn-primary" type="submit" disabled={loading || settingsLoading || !normalizedPhone}>
                    {loading && <span className="lp-spinner" />}
                    {loading ? 'Sending code…' : 'Send code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <span className="lp-otp-sent-badge">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" />
                      </svg>
                      Code sent
                    </span>
                  </div>
                  <div className="lp-field">
                    <label className="lp-label" style={{ textAlign: 'center', display: 'block' }}>Enter 6-digit code</label>
                    <div className="lp-otp-row">
                      {otpDigits.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          className={`lp-otp-box ${digit ? 'filled' : ''}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpDigit(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          autoFocus={i === 0}
                        />
                      ))}
                    </div>
                  </div>
                  <button className="lp-btn lp-btn-primary" type="submit" disabled={loading || !otpComplete}>
                    {loading && <span className="lp-spinner" />}
                    {loading ? 'Verifying…' : 'Verify & sign in'}
                  </button>
                  <div className="lp-sent-to">
                    <p>Code sent to <strong>{formatPhoneDisplay(submittedPhone)}</strong></p>
                    <button type="button" className="lp-link-btn" onClick={() => {
                      setOtpSent(false);
                      setSubmittedPhone('');
                      setOtpDigits(['', '', '', '', '', '']);
                      setSuccess('');
                      setError('');
                    }}>
                      Change phone number
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STAFF PANEL */}
          {activeTab === 'instructor' && (
            <form onSubmit={handleEmailLogin}>
              <div className="lp-field">
                <label className="lp-label">Email address</label>
                <input
                  className="lp-input"
                  type="email"
                  placeholder="name@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="lp-field">
                <label className="lp-label">Password</label>
                <div className="lp-input-wrap">
                  <input
                    className="lp-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ paddingRight: '44px' }}
                    autoComplete="current-password"
                  />
                  <button type="button" className="lp-pw-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <button type="button" className="lp-forgot">Forgot password?</button>
              </div>
              <button className="lp-btn lp-btn-primary" type="submit" disabled={loading}>
                {loading && <span className="lp-spinner" />}
                {loading ? 'Signing in…' : 'Sign in to dashboard'}
              </button>
            </form>
          )}

          <div className="lp-footer">
            <p>Need help? <a href="mailto:support@unikriti.in">Contact support</a></p>
          </div>

        </div>
      </div>
    </>
  );
}
