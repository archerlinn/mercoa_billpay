import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackToHomeButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className="text-sm text-indigo-600 hover:underline mb-4 inline-flex items-center"
    >
      ← Back to Home
    </button>
  );
};

export default BackToHomeButton;
