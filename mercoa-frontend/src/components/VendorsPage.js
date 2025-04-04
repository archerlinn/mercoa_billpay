import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import BackToHomeButton from './BackToHomeButton';

const VendorsPage = ({ entityId }) => {
  const [invoices, setInvoices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/invoices/', { entity_id: entityId });
      if (res.data.status === 'success') {
        setInvoices(res.data.invoices.data || []);
      }
    } catch (err) {
      console.error('📄 Invoice fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    if (entityId) loadInvoices();
  }, [entityId, loadInvoices]);

  useEffect(() => {
    // Extract unique vendors from invoices
    const vendorMap = new Map();
    invoices.forEach((inv) => {
      if (inv.vendor && inv.vendor.id) {
        vendorMap.set(inv.vendor.id, inv.vendor);
      }
    });
    setVendors(Array.from(vendorMap.values()));
  }, [invoices]);

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <BackToHomeButton />
      <h1 className="text-3xl font-bold text-indigo-800 mb-6">Your Vendors</h1>

      {loading ? (
        <p className="text-gray-600 text-center py-8">Loading vendors...</p>
      ) : vendors.length === 0 ? (
        <p className="text-gray-500 text-center">No vendors found from your invoices.</p>
      ) : (
        <ul className="bg-white rounded-xl shadow divide-y divide-gray-200">
          {vendors.map((vendor) => (
            <li key={vendor.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <p className="font-medium text-indigo-700 text-lg">{vendor.name || 'Unnamed Vendor'}</p>
                  <p className="text-sm text-gray-500">{vendor.email || 'No email'}</p>
                  {vendor.profile?.individual?.address?.city && (
                    <p className="text-sm text-gray-400">
                      {vendor.profile.individual.address.city}, {vendor.profile.individual.address.stateOrProvince}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VendorsPage;
