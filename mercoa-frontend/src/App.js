import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import OnboardingForm from './components/OnboardingForm';
import HomePage from './components/HomePage';

function App() {
  const [user, setUser] = useState({
    email: '',
    entityId: null,
    entityName: '',
    entityLogo: '',
  });

  const [page, setPage] = useState('login'); // 'login' | 'signup' | 'onboarding' | 'home'

  useEffect(() => {
    const saved = localStorage.getItem('mercoa_entity');
    const email = localStorage.getItem('logged_in_email');
    if (saved) {
      const parsed = JSON.parse(saved);
      const isOnboarded = !!parsed.entityId;

      setUser({ ...parsed, email: email || '' });
      setPage(isOnboarded ? 'home' : 'onboarding');
    }
  }, []);

  const handleLogin = (data) => {
    const info = {
      entityId: data.entityId,
      entityName: data.entityName,
      entityLogo: data.entityLogo,
      email: data.email,
    };
    localStorage.setItem('mercoa_entity', JSON.stringify(info));
    localStorage.setItem('logged_in_email', data.email);
    setUser(info);
    setPage(info.entityId ? 'home' : 'onboarding');
  };

  const handleSignup = (email) => {
    const info = { email, entityId: null, entityName: '', entityLogo: '' };
    setUser(info);
    localStorage.setItem('logged_in_email', email);
    setPage('onboarding');
  };

  const handleOnboardingComplete = (data) => {
    const updated = {
      ...user,
      entityId: data.entity_id,
      entityName: data.legalBusinessName,
      entityLogo: data.logo,
    };
    setUser(updated);
    localStorage.setItem('mercoa_entity', JSON.stringify(updated));
    setPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('mercoa_entity');
    localStorage.removeItem('logged_in_email');
    setUser({ email: '', entityId: null, entityName: '', entityLogo: '' });
    setPage('login');
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-sky-200 flex items-center justify-center px-4 font-inter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {page === 'home' && (
        <HomePage
          entityId={user.entityId}
          entityName={user.entityName}
          entityLogo={user.entityLogo}
          onLogout={handleLogout}
        />
      )}

      {page === 'onboarding' && (
        <div className="flex flex-col items-center w-full">
          <OnboardingForm onComplete={handleOnboardingComplete} email={user.email} />
          <button
            onClick={() => setPage('login')}
            className="mt-4 text-sm text-indigo-600 hover:underline"
          >
            ← Back to Login
          </button>
        </div>
      )}

      {page === 'signup' && (
        <SignupForm
          onSignup={({ email }) => handleSignup(email)}
          switchToLogin={() => setPage('login')}
        />
      )}

      {page === 'login' && (
        <LoginForm
          onLogin={handleLogin}
          switchToSignup={() => setPage('signup')}
        />
      )}
    </motion.div>
  );
}

export default App;
