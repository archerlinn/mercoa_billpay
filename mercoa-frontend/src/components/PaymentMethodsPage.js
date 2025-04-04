import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BackToHomeButton from './BackToHomeButton';

const fieldTypes = [
  'text',
  'select',
  'number',
  'usBankAccountNumber',
  'usBankRoutingNumber',
  'address',
  'phone',
  'email',
  'url',
];

const PaymentMethodsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    isSource: false,
    isDestination: true,
    supportedCurrencies: ['USD'],
    estimatedProcessingTime: 0,
    maxAmount: 100000,
    minAmount: 1,
    fields: [],
  });

  const [newField, setNewField] = useState({
    name: '',
    displayName: '',
    type: 'text',
    optional: false,
    useAsAccountName: false,
    useAsAccountNumber: false,
  });

  const [schemas, setSchemas] = useState([]);
  const [message, setMessage] = useState(null);

  const fetchSchemas = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/payment-method/schema/list/');
      if (res.data.status === 'success') {
        setSchemas(res.data.schemas);
      }
    } catch (err) {
      console.error('❌ Failed to fetch schemas:', err);
    }
  };

  const handleCreateSchema = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/payment-method/schema/create/', formData);
      if (res.data.status === 'success') {
        setMessage('✅ Schema created!');
        setFormData({
          name: '',
          isSource: false,
          isDestination: true,
          supportedCurrencies: ['USD'],
          estimatedProcessingTime: 0,
          maxAmount: 100000,
          minAmount: 1,
          fields: [],
        });
        fetchSchemas();
      }
    } catch (err) {
      console.error('❌ Failed to create schema:', err);
    }
  };

  const handleDeleteSchema = async (schemaId) => {
    try {
      const res = await axios.post('http://localhost:8000/api/payment-method/schema/delete/', {
        schema_id: schemaId,
      });
      if (res.data.status === 'success') {
        setMessage('🗑️ Schema deleted.');
        fetchSchemas();
      }
    } catch (err) {
      console.error('❌ Failed to delete schema:', err);
    }
  };

  const handleAddField = () => {
    if (!newField.name || !newField.displayName) return;
    setFormData({
      ...formData,
      fields: [...formData.fields, newField],
    });
    setNewField({
      name: '',
      displayName: '',
      type: 'text',
      optional: false,
      useAsAccountName: false,
      useAsAccountNumber: false,
    });
  };

  useEffect(() => {
    fetchSchemas();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <BackToHomeButton />
      <h1 className="text-3xl font-bold text-indigo-800 mb-6">Manage Payment Method Schemas</h1>

      {message && (
        <div className="mb-6 bg-green-100 text-green-700 px-4 py-2 rounded-md">
          {message}
        </div>
      )}

      {/* Schema Creation Form */}
      <div className="bg-white p-6 rounded-xl shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">Create New Schema</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Schema Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <select
            value={formData.supportedCurrencies[0]}
            onChange={(e) => setFormData({ ...formData, supportedCurrencies: [e.target.value] })}
            className="border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Transaction Amount
            </label>
            <input
              id="maxAmount"
              type="number"
              placeholder="e.g. 100000"
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={formData.maxAmount}
              onChange={(e) =>
                setFormData({ ...formData, maxAmount: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div>
            <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Transaction Amount
            </label>
            <input
              id="minAmount"
              type="number"
              placeholder="e.g. 1"
              className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={formData.minAmount}
              onChange={(e) =>
                setFormData({ ...formData, minAmount: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Schema Fields</h3>

          {/* New Field Builder */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
            <input
              className="border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Field Name (e.g. accountNumber)"
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
            />
            <input
              className="border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Display Name (e.g. Account Number)"
              value={newField.displayName}
              onChange={(e) => setNewField({ ...newField, displayName: e.target.value })}
            />
            <select
              className="border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={newField.type}
              onChange={(e) => setNewField({ ...newField, type: e.target.value })}
            >
              {fieldTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="flex flex-col gap-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newField.optional}
                  onChange={(e) => setNewField({ ...newField, optional: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Optional</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleAddField}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
          >
            + Add Field
          </button>

          {/* Dynamic Preview of Added Fields */}
          {formData.fields.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-gray-700">Added Fields</h4>
              {formData.fields.map((field, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center border border-gray-200 rounded-md p-3 bg-gray-50 text-sm"
                >
                  <div>
                    <strong>{field.displayName}</strong> ({field.name}) — <em>{field.type}</em>
                    {field.optional && <span className="text-gray-500"> (Optional)</span>}
                    {field.useAsAccountName && (
                      <span className="text-gray-500 ml-2">· Account Name</span>
                    )}
                    {field.useAsAccountNumber && (
                      <span className="text-gray-500 ml-2">· Account Number</span>
                    )}
                  </div>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        fields: formData.fields.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={handleCreateSchema}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
          >
            Create Payment Method Schema
          </button>
        </div>
      </div>

      {/* Schemas List */}
      <div className="bg-white p-6 rounded-xl shadow mt-8">
        <h2 className="text-xl font-semibold mb-4">Your Schemas</h2>
        {schemas.length === 0 ? (
          <p className="text-gray-500">No schemas found.</p>
        ) : (
          <ul className="space-y-4">
            {schemas.map((schema) => (
              <li key={schema.id} className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-indigo-700">{schema.name}</h3>
                    <p className="text-sm text-gray-600">
                      Supported: {schema.supportedCurrencies.join(', ')}
                    </p>
                    <ul className="list-disc ml-5 text-sm text-gray-700">
                      {schema.fields.map((field) => (
                        <li key={field.name}>
                          {field.displayName} ({field.type})
                          {field.optional ? ' (Optional)' : ''}
                          {field.useAsAccountName ? ' · Account Name' : ''}
                          {field.useAsAccountNumber ? ' · Account Number' : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => handleDeleteSchema(schema.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodsPage;
