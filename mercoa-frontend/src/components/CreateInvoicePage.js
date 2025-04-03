import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateInvoicePage = ({ entityId }) => {
  const navigate = useNavigate();
  const [payeeId, setPayeeId] = useState('');
  const [memo, setMemo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lineItems, setLineItems] = useState([
    { description: '', quantity: 1, unitPrice: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleLineItemChange = (index, key, value) => {
    const updated = [...lineItems];
    updated[index][key] = key.includes("Price") || key === "quantity" ? parseFloat(value) : value;
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post('http://localhost:8000/api/invoices/create/', {
        entityId,
        payeeId,
        memo,
        dueDate,
        lineItems,
      });

      if (res.data.status === 'success') {
        alert('Invoice created!');
        navigate(`/invoices/${entityId}`);
      }
    } catch (err) {
      alert('Failed to create invoice');
      console.error(err);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl p-8 shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Create New Invoice</h2>

      <input
        type="text"
        placeholder="Payee Entity ID"
        value={payeeId}
        onChange={(e) => setPayeeId(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <textarea
        placeholder="Memo"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />

      <h3 className="text-lg font-semibold mb-2">Line Items</h3>
      {lineItems.map((item, i) => (
        <div key={i} className="grid grid-cols-3 gap-4 mb-2">
          <input
            placeholder="Description"
            value={item.description}
            onChange={(e) => handleLineItemChange(i, 'description', e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Qty"
            value={item.quantity}
            onChange={(e) => handleLineItemChange(i, 'quantity', e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Unit Price"
            value={item.unitPrice}
            onChange={(e) => handleLineItemChange(i, 'unitPrice', e.target.value)}
            className="p-2 border rounded"
          />
        </div>
      ))}
      <button onClick={addLineItem} className="text-sm text-indigo-600 mt-2 mb-6 hover:underline">+ Add Line Item</button>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
      >
        {submitting ? 'Creating...' : 'Create Invoice'}
      </button>
    </div>
  );
};

export default CreateInvoicePage;
