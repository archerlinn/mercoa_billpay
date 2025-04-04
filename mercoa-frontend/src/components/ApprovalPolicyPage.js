import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BackToHomeButton from './BackToHomeButton';

const ROLE_OPTIONS = ['admin', 'approver', 'general'];

const ApprovalPoliciesPage = ({ entityId }) => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [newRoles, setNewRoles] = useState([]);
  const [newNumApprovers, setNewNumApprovers] = useState('');

  const fetchPolicies = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/entity/approval-policy/list/', {
        entity_id: entityId,
      });
      if (res.data.status === 'success') {
        const policies = Array.isArray(res.data.policies.data)
          ? res.data.policies.data
          : res.data.policies;
        setPolicies(policies);
      }
    } catch (err) {
      console.error('Failed to load approval policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPolicy = async () => {
    try {
      await axios.post('http://localhost:8000/api/entity/approval-policy/create/', {
        entity_id: entityId,
        amount: parseFloat(newAmount),
        currency: newCurrency,
        roles: newRoles,
        num_approvers: parseInt(newNumApprovers),
      });
      setNewAmount('');
      setNewCurrency('USD');
      setNewRoles([]);
      setNewNumApprovers('');
      fetchPolicies();
    } catch (err) {
      console.error('Error creating policy:', err);
    }
  };

  const updatePolicy = async () => {
    try {
      await axios.post('http://localhost:8000/api/entity/approval-policy/update/', {
        entity_id: entityId,
        policy_id: editingPolicy.id,
        amount: parseFloat(editingPolicy.amount),
        currency: editingPolicy.currency,
        roles: editingPolicy.roles,
        num_approvers: parseInt(editingPolicy.numApprovers),
      });
      setEditingPolicy(null);
      fetchPolicies();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const deletePolicy = async (policyId) => {
    try {
      await axios.post('http://localhost:8000/api/entity/approval-policy/delete/', {
        entity_id: entityId,
        policy_id: policyId,
      });
      fetchPolicies();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [entityId]);

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-xl rounded-xl mt-10">
      <BackToHomeButton />
      <h2 className="text-3xl font-bold mb-6 text-indigo-800">Approval Policies</h2>

      {/* CREATE FORM */}
      <div className="mb-8 border-b pb-6">
        <h3 className="text-xl font-semibold mb-4">Create New Policy</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <input
            type="number"
            placeholder="Amount"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <input
            placeholder="Currency"
            value={newCurrency}
            onChange={(e) => setNewCurrency(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <select
            value={newRoles[0] || ''}
            onChange={(e) => setNewRoles([e.target.value])}
            className="border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">Select Role</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="# Approvers"
            value={newNumApprovers}
            onChange={(e) => setNewNumApprovers(e.target.value)}
            className="border border-gray-300 px-3 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
          <button
            onClick={createPolicy}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition"
          >
            + Add Policy
          </button>
        </div>
      </div>

      {/* POLICIES TABLE */}
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : policies.length === 0 ? (
        <p className="text-gray-500">No policies found.</p>
      ) : (
        <table className="w-full table-auto text-sm">
          <thead className="bg-indigo-100 text-indigo-700 uppercase tracking-wide text-left">
            <tr>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Currency</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3"># Approvers</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {policies.map((policy) => {
              const trigger = policy.trigger?.[0] || {};
              const rule = policy.rule || {};
              const roles = rule.identifierList?.value || [];
              const isEditing = editingPolicy?.id === policy.id;

              return (
                <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editingPolicy.amount}
                        onChange={(e) =>
                          setEditingPolicy({ ...editingPolicy, amount: e.target.value })
                        }
                        className="border border-gray-300 px-2 py-1 rounded w-full focus:ring-indigo-500 transition"
                      />
                    ) : (
                      trigger.amount
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        value={editingPolicy.currency}
                        onChange={(e) =>
                          setEditingPolicy({ ...editingPolicy, currency: e.target.value })
                        }
                        className="border border-gray-300 px-2 py-1 rounded w-full focus:ring-indigo-500 transition"
                      />
                    ) : (
                      trigger.currency
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={editingPolicy.roles[0]} // assuming only one role
                        onChange={(e) =>
                          setEditingPolicy({
                            ...editingPolicy,
                            roles: [e.target.value],
                          })
                        }
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      roles.join(', ')
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editingPolicy.numApprovers}
                        onChange={(e) =>
                          setEditingPolicy({ ...editingPolicy, numApprovers: e.target.value })
                        }
                        className="border border-gray-300 px-2 py-1 rounded w-full focus:ring-indigo-500 transition"
                      />
                    ) : (
                      rule.numApprovers
                    )}
                  </td>
                  <td className="px-4 py-3 flex space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={updatePolicy}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPolicy(null)}
                          className="bg-gray-300 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-400 transition"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            setEditingPolicy({
                              id: policy.id,
                              amount: trigger.amount,
                              currency: trigger.currency,
                              roles: roles,
                              numApprovers: rule.numApprovers,
                            })
                          }
                          className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deletePolicy(policy.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ApprovalPoliciesPage;
