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
    },
    {
      title: 'Users',
      description: 'Manage people in your business.',
      action: () => navigate('/users')
    },
    {
      title: 'Approval Policy',
      description: 'Manage invoice approval rules and approvers.',
      action: () => navigate('/approval-policy')
    },
    {
      title: 'Payment Methods',
      description: 'Manage and customize payment methods.',
      action: () => navigate('/payment-methods')
    },
    {
      title: 'Vendors',
      description: 'View and manage your business vendors.',
      action: () => navigate('/vendors')
    },
    {
      title: 'AP Aging Report',
      description: 'View your AP Aging Report.',
      action: () => navigate('/aging-report')
    }
  ];

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-100 to-sky-200 px-4 py-6 font-inter"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-7xl mx-auto py-8">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-12"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center space-x-6">
            {entityLogo ? (
              <img src={entityLogo} alt="Business Logo" className="w-16 h-16 rounded-full shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-2xl shadow-lg">
                🏢
              </div>
            )}
            <div>
              <h1 className="text-4xl font-extrabold text-blue-900 leading-tight">
                {entityName || 'Business Dashboard'}
              </h1>
              <p className="text-base text-gray-600">Welcome back! Choose what you’d like to manage below.</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md shadow transition duration-200"
          >
            Logout
          </button>
        </motion.div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.03, boxShadow: '0 12px 25px rgba(0, 0, 0, 0.15)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={card.action}
              className="relative cursor-pointer bg-white p-8 rounded-xl shadow-md transition-all border border-transparent hover:border-blue-200"
            >
              {/* Accent Bar */}
              <div className="absolute top-0 left-0 h-full w-1 rounded-tr-xl rounded-br-xl bg-blue-400"></div>
              <h2 className="ml-4 text-xl font-semibold text-blue-800 mb-3">{card.title}</h2>
              <p className="ml-4 text-gray-600 text-sm">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
