import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MercoaSession, PayableDetailsV1 } from '@mercoa/react';
import '@mercoa/react/dist/style.css';
import { motion } from 'framer-motion';

const InvoicesPage = ({ entityId, email }) => {
  const [token, setToken] = useState(null);
  const [invoices, setInvoices] = useState({ count: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [editorInvoiceId, setEditorInvoiceId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const tokenRes = await axios.post('http://localhost:8000/api/mercoa/token/', { email });
        if (tokenRes.data.status === 'success') {
          setToken(tokenRes.data.token);
        }

        const invRes = await axios.post('http://localhost:8000/api/invoices/', {
          entity_id: entityId,
        });
        if (invRes.data.status === 'success') {
          setInvoices(invRes.data.invoices);
        }
      } catch (err) {
        console.error('Error loading invoices or token:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [entityId, email]);

  const openEditor = (invoiceId = null) => {
    setEditorInvoiceId(invoiceId);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setEditorInvoiceId(null);
    setShowEditor(false);
  };

  const handleInvoiceUpdate = () => {
    closeEditor();
    window.location.reload(); // reload to fetch updated list
  };

  if (loading || !token) {
    return <div className="text-center py-10 text-gray-600">Loading...</div>;
  }

  return (
    <MercoaSession token={token}>
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-800">Your Invoices</h1>
          <button
            onClick={() => openEditor()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            + Create Invoice
          </button>
        </div>

        {invoices.data?.length === 0 ? (
          <p className="text-gray-500">No invoices found.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-100 text-indigo-700 text-sm uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Vendor</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {invoices.data.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 capitalize">{inv.vendor?.name || 'Unknown'}</td>
                    <td className="px-4 py-3 capitalize">{inv.status}</td>
                    <td className="px-4 py-3">
                        {inv.currency} ${inv.amount?.toFixed(2) || '0.00'}                    </td>
                    <td className="px-4 py-3">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditor(inv.id)}
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showEditor && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              className="bg-white max-w-4xl w-full p-6 rounded-xl shadow-2xl relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={closeEditor}
                className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl"
              >
                ✕
              </button>
              <PayableDetailsV1
                invoiceId={editorInvoiceId}
                documentPosition="left"
                heightOffset={140}
                onUpdate={(invoice) => {
                    if (!invoice) return;
                    console.log('✅ Invoice updated:', invoice);
                    closeEditor();
                    window.location.reload();
                }}
              />
            </motion.div>
          </div>
        )}
      </div>
    </MercoaSession>
  );
};

export default InvoicesPage;
