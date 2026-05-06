import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function SignUp() {
  const navigate = useNavigate();
  const { signin } = useAuth();

  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await signUp({
        name:     form.name,
        email:    form.email,
        password: form.password,
      });
      signin(res.data.user, res.data.token);
      navigate('/modules');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Password strength indicator
  const strength = form.password.length === 0 ? null
    : form.password.length < 8  ? 'weak'
    : form.password.length < 12 ? 'fair'
    : 'strong';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔐</div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start learning secure coding today</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
            />
            {strength && (
              <div className={`strength-bar strength-${strength}`}>
                <div className="strength-fill" />
                <span className="strength-label">{strength}</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
