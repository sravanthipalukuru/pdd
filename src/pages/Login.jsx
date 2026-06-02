import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { User, Mail, Lock, Smile, Camera } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [isLogin, setIsLogin]       = useState(false);
  const [step, setStep]             = useState(1); // 1=credentials, 2=otp, 3=child profile
  const [parentName, setParentName] = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);

  const [childName, setChildName]   = useState('');
  const [childAge, setChildAge]     = useState('');
  const [childBday, setChildBday]   = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😊');
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const otpRefs      = useRef([]);
  const nameRef      = useRef(null);
  const emailRef     = useRef(null);
  const passwordRef  = useRef(null);
  const login        = useStore(s => s.login);
  const setAvatar    = useStore(s => s.setAvatar);
  const setProfile   = useStore(s => s.setProfile);
  const navigate     = useNavigate();

  // Clear stale errors on mount and sync autofilled values
  useEffect(() => {
    setError('');
    // Poll briefly for autofill (browsers fill after a short delay)
    const timer = setTimeout(() => {
      if (nameRef.current?.value && !parentName) setParentName(nameRef.current.value);
      if (emailRef.current?.value && !email) setEmail(emailRef.current.value);
      if (passwordRef.current?.value && !password) setPassword(passwordRef.current.value);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const avatarList = ['😊','🐻','🦁','🦊','🐯','🐰','🐼','🐨','🐸','🐶','🐱','😄'];

  /* ─── Step 1: Submit credentials ─── */
  const handleCredentials = async (e) => {
    e.preventDefault();
    // Read directly from DOM to catch browser-autofilled values React state may have missed
    const finalName     = nameRef.current?.value?.trim()     || parentName.trim();
    const finalEmail    = emailRef.current?.value?.trim()    || email.trim();
    const finalPassword = passwordRef.current?.value         || password;

    if (!finalEmail.includes('@')) return setError('Please enter a valid Gmail address');
    if (!isLogin && !finalName) return setError('Please enter your name');
    if (finalPassword.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true); setError('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email: finalEmail, password: finalPassword }
        : { parentName: finalName, email: finalEmail, password: finalPassword };

      const res  = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Something went wrong');

      setStep(2);
    } catch { setError('Server error. Please try again.'); }
    finally   { setLoading(false); }
  };

  /* ─── Step 2: Verify OTP ─── */
  const handleOtpChange = (i, val) => {
    if (isNaN(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next); setError('');
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return setError('Please enter the 6-digit OTP');

    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), otp: code }) });
      const data = await res.json();
      if (!res.ok) return setError(data.message || 'Invalid OTP');

      // Log in the user
      login(data.userId);

      if (data.isNewUser) {
        // New signup → go to child profile step
        setStep(3);
      } else {
        navigate('/');
      }
    } catch { setError('Server error. Please try again.'); }
    finally   { setLoading(false); }
  };

  /* ─── Step 3: Child Profile ─── */
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await setAvatar(avatarEmoji);
      await setProfile({
        displayName: childName.trim() || undefined,
        age: childAge ? parseInt(childAge) : undefined,
        birthday: childBday || undefined
      });
    } catch {}
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* ── STEP 1: Credentials ── */}
        {step === 1 && (
          <>
            <div className="auth-header">
              <div className="auth-icon-wrapper">
                <Smile size={40} color="white" strokeWidth={2.5} />
              </div>
              <h1 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
              <p className="auth-subtitle">{isLogin ? 'Sign in to continue' : 'Join Dental Buddy today'}</p>
            </div>

            <form onSubmit={handleCredentials} className="auth-form" autoComplete="on">
              {!isLogin && (
                <div className="auth-input-group">
                  <User size={20} className="auth-input-icon" />
                  <input ref={nameRef} type="text" placeholder="Parent Name" autoComplete="name" value={parentName} onChange={e => { setParentName(e.target.value); setError(''); }} disabled={loading} />
                </div>
              )}

              <div className="auth-input-group">
                <Mail size={20} className="auth-input-icon" />
                <input ref={emailRef} type="email" placeholder="Gmail Address" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} disabled={loading} />
              </div>

              <div className="auth-input-group">
                <Lock size={20} className="auth-input-icon" />
                <input ref={passwordRef} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} disabled={loading} />
              </div>

              {error && <p className="auth-error-msg">{error}</p>}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Please wait...' : (isLogin ? 'Send OTP' : 'Sign Up & Send OTP')}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button className="auth-toggle-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }} disabled={loading}>
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === 2 && (
          <>
            <div className="auth-header">
              <div className="auth-icon-wrapper" style={{ background: 'linear-gradient(135deg,#74ebd5,#acb6e5)' }}>
                <span style={{ fontSize: 36 }}>📩</span>
              </div>
              <h1 className="auth-title">Enter OTP</h1>
              <p className="auth-subtitle">We sent a 6-digit code to<br /><strong>{email}</strong></p>
            </div>

            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="otp-row">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    className="otp-box"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    autoFocus={i === 0}
                    disabled={loading}
                  />
                ))}
              </div>

              {error && <p className="auth-error-msg">{error}</p>}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button type="button" className="auth-back-btn" onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); }} disabled={loading}>
                ← Back
              </button>
            </form>
          </>
        )}

        {/* ── STEP 3: Child Profile (new users only) ── */}
        {step === 3 && (
          <>
            <div className="auth-header">
              <h1 className="auth-title">Child Profile</h1>
            </div>

            <div className="profile-avatar-area">
              <div className="profile-big-avatar">{avatarEmoji}</div>
              <button className="profile-camera-btn" onClick={() => setShowPicker(!showPicker)}>
                <Camera size={16} color="white" />
              </button>
              {showPicker && (
                <div className="avatar-picker-grid">
                  {avatarList.map(a => (
                    <button key={a} className={`av-opt ${avatarEmoji === a ? 'av-opt--sel' : ''}`}
                      onClick={() => { setAvatarEmoji(a); setShowPicker(false); }}>
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="auth-form">
              <div className="profile-form-group">
                <label>Child's Name</label>
                <input type="text" placeholder="Enter name" value={childName} onChange={e => setChildName(e.target.value)} />
              </div>

              <div className="profile-form-group">
                <label>Age</label>
                <div className="profile-input-with-icon">
                  <span className="profile-input-icon">🎂</span>
                  <input type="number" placeholder="Age" value={childAge} onChange={e => setChildAge(e.target.value)} />
                </div>
              </div>

              <div className="profile-form-group">
                <label>Birthday</label>
                <div className="profile-input-with-icon">
                  <span className="profile-input-icon">📅</span>
                  <input type="date" value={childBday} onChange={e => setChildBday(e.target.value)} />
                </div>
              </div>

              <button className="auth-submit-btn" onClick={handleSaveProfile} disabled={loading} style={{ marginTop: 8 }}>
                {loading ? 'Saving...' : 'Save Profile'}
              </button>

              <button className="auth-back-btn" onClick={() => navigate('/')} disabled={loading}>
                Skip for now
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
