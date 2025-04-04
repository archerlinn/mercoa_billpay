import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MercoaSession, PayableDetailsV1 } from '@mercoa/react';
import '@mercoa/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import BackToHomeButton from './BackToHomeButton';

const InvoicesPage = ({ entityId, email }) => {
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  const loadMercoaToken = useCallback(async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/mercoa/token/', { email });
      if (res.data.status === 'success') setToken(res.data.token);
    } catch (err) {
      console.error('🔐 Token error:', err);
    }
  }, [email]);

  const loadInvoices = useCallback(async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/invoices/', { entity_id: entityId });
      if (res.data.status === 'success') setInvoices(res.data.invoices.data || []);
    } catch (err) {
      console.error('📄 Invoice fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  const handleApproveInvoice = async (invoiceId) => {
    try {
      await axios.post('http://localhost:8000/api/invoice/approve/', { invoice_id: invoiceId });
      loadInvoices(); // Refresh list
    } catch (err) {
      console.error('❌ Approve invoice error:', err);
    }
  };

  useEffect(() => {
    if (entityId && email) {
      loadMercoaToken();
      loadInvoices();
    }
  }, [entityId, email, loadMercoaToken, loadInvoices]);

  const handleEditorClose = () => setSelectedInvoiceId(null);

  if (loading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <p className="py-10 text-lg">Loading invoices...</p>
      </div>
    );
  }

  return (
    <MercoaSession token={token}>
      <div className="max-w-6xl mx-auto py-10 px-6">
        <BackToHomeButton />
        <motion.div
          className="flex flex-col sm:flex-row justify-between items-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-indigo-800 tracking-wide mb-4 sm:mb-0">
            Your Invoices
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/invoices/new')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200"
          >
            + Create Invoice
          </motion.button>
        </motion.div>

        {invoices.length === 0 ? (
          <motion.p
            className="text-gray-500 text-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            No invoices found.
          </motion.p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-100 text-indigo-700 text-sm uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Vendor</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Due Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <motion.tr
                    key={inv.id}
                    className="hover:bg-gray-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-6 py-3 capitalize">{inv.vendor?.name || 'Unknown'}</td>
                    <td className="px-6 py-3 capitalize">{inv.status}</td>
                    <td className="px-6 py-3">
                      {inv.currency} ${inv.amount?.toFixed(2)}
                    </td>
                    <td className="px-6 py-3">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-3 space-x-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceId(inv.id)}
                        className="text-indigo-600 hover:underline text-sm font-medium"
                      >
                        Edit
                      </button>
                      {(inv.status === 'submitted' || inv.status === 'NEW') && (
                        <button
                          onClick={() => handleApproveInvoice(inv.id)}
                          className="text-green-600 hover:underline text-sm font-medium"
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AnimatePresence>
          {selectedInvoiceId !== null && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white max-w-4xl w-full p-8 rounded-2xl shadow-2xl relative"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={handleEditorClose}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
                >
                  ✕
                </button>
                <PayableDetailsV1
                  invoiceId={selectedInvoiceId}
                  documentPosition="left"
                  heightOffset={140}
                  onUpdate={(invoice) => {
                    console.log('📄 Updated:', invoice);
                    loadInvoices();
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MercoaSession>
  );
};

export default InvoicesPage;
