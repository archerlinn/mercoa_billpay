import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import logo from '../assets/mercoa_logo.png';

const SignupForm = ({ onSignup, switchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post('http://localhost:8000/api/signup/', {
        email,
        password,
      });

      if (res.data.status === 'created') {
        onSignup({ email });
      } else {
        setError('Signup failed. Try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Maybe user already exists.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        className="max-w-md w-full mx-auto p-10 rounded-3xl shadow-2xl bg-white/80 backdrop-blur-sm border border-white/30"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <img src={logo} alt="Mercoa Logo" className="mx-auto mb-4 h-12 w-auto" />
        <h2 className="text-3xl font-extrabold text-indigo-800 text-center mb-8 tracking-tight">
          Create an Account
        </h2>
        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className={`w-full py-3 text-white font-semibold rounded-xl transition ${
              loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </motion.button>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button type="button" onClick={switchToLogin} className="text-indigo-600 underline">
              Log In
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default SignupForm;
