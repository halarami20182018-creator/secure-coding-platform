import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      </div>
    );
  }

  return user ? children : <Navigate to="/signin" replace />;
}
