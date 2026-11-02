import React, { useState } from 'react';
import { Eye, EyeOff, GraduationCap, LockKeyhole, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/MU.jpg';
import { DEMO_MODE } from '../config';

export default function Login() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!loginId.trim() || !password) {
      setError('Please enter your login ID and password.');
      return;
    }
    try {
      setSubmitting(true);
      await login(loginId.trim(), password, remember);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-icon"><GraduationCap size={28} /></div>
          <div>
            <h1>Campus</h1>
            <p>Metropolitan University</p>
          </div>
        </div>
        <div className="login-logo"><img src={logo} alt="Metropolitan University" /></div>
        <h2>Sign in to your account</h2>
        <p className="login-subtitle">Use your university login credentials to continue.</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={submit} noValidate>
          <label className="form-label" htmlFor="loginId">Student ID / Login ID</label>
          <div className="input-wrap">
            <UserRound size={18} />
            <input id="loginId" value={loginId} onChange={(e) => setLoginId(e.target.value)}
              autoComplete="username" placeholder="Enter your ID" disabled={submitting} />
          </div>

          <label className="form-label" htmlFor="password">Password</label>
          <div className="input-wrap">
            <LockKeyhole size={18} />
            <input id="password" type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
              placeholder="Enter your password" disabled={submitting} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <label className="remember-row">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember me</span>
          </label>

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {DEMO_MODE && (
          <div className="demo-note">
            <strong>Demo mode:</strong> any non-empty Student ID and password will sign in.
            Set <code>REACT_APP_DEMO_MODE=false</code> to use your backend.
          </div>
        )}
      </section>
    </main>
  );
}
