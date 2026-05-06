import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Home        from './pages/Home';
import SignIn      from './pages/SignIn';
import SignUp      from './pages/SignUp';
import Modules     from './pages/Modules';
import ModuleDetail from './pages/ModuleDetail';
import AIReview    from './pages/AIReview';
import Challenges  from './pages/Challenges';
import Progress    from './pages/Progress';

export default function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/"        element={<Home />} />
            <Route path="/signin"  element={<SignIn />} />
            <Route path="/signup"  element={<SignUp />} />

            {/* Protected routes */}
            <Route path="/modules" element={
              <ProtectedRoute><Modules /></ProtectedRoute>
            } />
            <Route path="/modules/:id" element={
              <ProtectedRoute><ModuleDetail /></ProtectedRoute>
            } />
            <Route path="/ai-review" element={
              <ProtectedRoute><AIReview /></ProtectedRoute>
            } />
            <Route path="/challenges" element={
              <ProtectedRoute><Challenges /></ProtectedRoute>
            } />
            <Route path="/progress" element={
              <ProtectedRoute><Progress /></ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
