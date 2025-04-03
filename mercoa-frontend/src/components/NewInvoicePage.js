import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MercoaSession, PayableDetailsV1 } from '@mercoa/react';
import '@mercoa/react/dist/style.css';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NewInvoicePage = ({ entityId, email }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await axios.post('http://localhost:8000/api/mercoa/token/', {
          email,
        });

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
    if (!invoice) {
      navigate(`/invoices/${entityId}`);
    } else {
      navigate(`/invoices/${entityId}`);
    }
  };

  if (loading || !token) {
    return <div className="text-center py-10 text-gray-600">Loading invoice editor...</div>;
  }

  return (
    <MercoaSession token={token}>
      <div className="min-h-screen bg-gray-50 py-10 px-6">
        <motion.div
          className="bg-white max-w-4xl mx-auto p-8 rounded-2xl shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-semibold text-indigo-700 mb-6">Create a New Invoice</h1>
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
