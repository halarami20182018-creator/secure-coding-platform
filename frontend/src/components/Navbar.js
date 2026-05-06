import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/api';
import './Navbar.css';

export default function Navbar() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    try { await signOut(); } catch {}
    signout();
    navigate('/signin');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        🔐 SecureCode Learn
      </Link>

      {user && (
        <ul className="navbar-links">
          <li><NavLink to="/modules">Modules</NavLink></li>
          <li><NavLink to="/ai-review">AI Review</NavLink></li>
          <li><NavLink to="/challenges">Challenges</NavLink></li>
          <li><NavLink to="/progress">Progress</NavLink></li>
        </ul>
      )}

      <div className="navbar-right">
        {user ? (
          <>
            <span className="navbar-user">👤 {user.name}</span>
            <button className="navbar-signout" onClick={handleSignOut}>Sign Out</button>
          </>
        ) : (
          <>
            <Link to="/signin"  className="navbar-auth-link">Sign In</Link>
            <Link to="/signup"  className="navbar-auth-btn">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
