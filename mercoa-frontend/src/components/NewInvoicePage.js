import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MercoaSession, PayableDetailsV1 } from '@mercoa/react';
import '@mercoa/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackToHomeButton from './BackToHomeButton';

const NewInvoicePage = ({ entityId, email }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await axios.post('http://localhost:8000/api/mercoa/token/', { email });
        if (res.data.status === 'success') {
          setToken(res.data.token);
        } else {
          console.error('Failed to fetch Mercoa token');
        }
      } catch (err) {
        console.error('Error fetching Mercoa token:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [email]);

  const handleInvoiceCreated = (invoice) => {
    navigate(`/invoices/${entityId}`);
  };

  if (loading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <p className="text-lg py-10">Loading invoice editor...</p>
      </div>
    );
  }

  return (
    <MercoaSession token={token}>
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <BackToHomeButton />
        <motion.div
          className="bg-white max-w-4xl mx-auto p-10 rounded-2xl shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-indigo-700 mb-8 tracking-wide">
            Create a New Invoice
          </h1>
          <PayableDetailsV1
            documentPosition="left"
            heightOffset={160}
            onUpdate={handleInvoiceCreated}
          />
        </motion.div>
      </div>
    </MercoaSession>
  );
};

export default NewInvoicePage;
