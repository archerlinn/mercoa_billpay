import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

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
    <motion.div
      className="max-w-md w-full backdrop-blur-lg bg-white/60 shadow-2xl rounded-3xl p-10 border border-white/40"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <h2 className="text-2xl font-bold text-indigo-800 text-center mb-6">Create an Account</h2>
      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          disabled={loading}
          className={`w-full py-2 text-white font-semibold rounded-lg transition ${
            loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </motion.button>
        <p className="text-center text-sm text-gray-600 mt-2">
          Already have an account?{' '}
          <button type="button" onClick={switchToLogin} className="text-indigo-600 underline">
            Log In
          </button>
        </p>
      </form>
    </motion.div>
  );
};

export default SignupForm;
