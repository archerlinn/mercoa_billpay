import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HomePage = ({ entityId, entityName, entityLogo, onLogout }) => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'View Invoices',
      description: 'See your business payables and receivables.',
      action: () => navigate(`/invoices/${entityId}`)
    },
    {
      title: 'Add Invoice',
      description: 'Upload and create a new invoice.',
      action: () => navigate('/invoices/new')
    },
    {
      title: 'Settings',
      description: 'Manage business information and preferences.',
      action: () => navigate('/settings')
    }
  ];

  return (
    <motion.div
      className="max-w-5xl mx-auto p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          {entityLogo ? (
            <img src={entityLogo} alt="Business Logo" className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
              🏢
            </div>
          )}
          <h1 className="text-2xl font-bold">{entityName || 'Business Dashboard'}</h1>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer"
            onClick={card.action}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && card.action()}
          >
            <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
            <p className="text-gray-600 text-sm">{card.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default HomePage;
