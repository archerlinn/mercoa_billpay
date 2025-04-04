import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import OnboardingForm from './components/OnboardingForm';
import HomePage from './components/HomePage';
import InvoicesPage from './components/InvoicesPage';
import NewInvoicePage from './components/NewInvoicePage';
import EntityUsersPage from './components/EntityUsersPage';
import ApprovalPolicyPage from './components/ApprovalPolicyPage';
import PaymentMethodsPage from './components/PaymentMethodsPage';
import VendorsPage from './components/VendorsPage';
import AgingReportPage from './components/AgingReportPage';

function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    email: '',
    entityId: null,
    entityName: '',
    entityLogo: '',
  });
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('mercoa_entity');
    const email = localStorage.getItem('logged_in_email');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser({ ...parsed, email: email || '' });
    }
    setLoadingUser(false);
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
    navigate('/');
  };

  const handleSignup = (email) => {
    const info = { email, entityId: null, entityName: '', entityLogo: '' };
    setUser(info);
    localStorage.setItem('logged_in_email', email);
    navigate('/');
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
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('mercoa_entity');
    localStorage.removeItem('logged_in_email');
    setUser({ email: '', entityId: null, entityName: '', entityLogo: '' });
    navigate('/login');
  };

  const isLoggedIn = !!user.email;
  const isOnboarded = !!user.entityId;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-sky-200 px-4 py-6 font-inter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Routes>
        <Route
          path="/"
          element={
            loadingUser ? (
              <div className="text-center py-10 text-gray-600">Loading...</div>
            ) : !isLoggedIn ? (
              <Navigate to="/login" />
            ) : isOnboarded ? (
              <HomePage
                entityId={user.entityId}
                entityName={user.entityName}
                entityLogo={user.entityLogo}
                onLogout={handleLogout}
              />
            ) : (
              <div className="flex flex-col items-center w-full">
                <OnboardingForm
                  email={user.email}
                  onComplete={handleOnboardingComplete}
                />
                <button
                  onClick={handleLogout}
                  className="mt-4 text-sm text-indigo-600 hover:underline"
                >
                  ← Log out
                </button>
              </div>
            )
          }
        />
        <Route
          path="/login"
          element={
            <LoginForm
              onLogin={handleLogin}
              switchToSignup={() => navigate('/signup')}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignupForm
              onSignup={({ email }) => handleSignup(email)}
              switchToLogin={() => navigate('/login')}
            />
          }
        />
        <Route
          path="/invoices/:entityId"
          element={
            user.entityId && user.email ? (
              <InvoicesPage
                entityId={user.entityId}
                email={user.email}
              />
            ) : (
              <div className="text-center mt-10 text-gray-500">Loading invoice data...</div>
            )
          }
        />
        <Route
          path="/invoices/new"
          element={<NewInvoicePage entityId={user.entityId} email={user.email} />}
        />
        <Route
          path="/users"
          element={<EntityUsersPage entityId={user.entityId} />}
        />
        <Route
          path="/approval-policy"
          element={<ApprovalPolicyPage entityId={user.entityId} />}
        />
        <Route path="/payment-methods" element={<PaymentMethodsPage />} />
        <Route
          path="/vendors"
          element={<VendorsPage entityId={user.entityId} />}
        />
        <Route path="/aging-report" element={<AgingReportPage entityId={user.entityId} />} />        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </motion.div>
  );
}

export default App;
