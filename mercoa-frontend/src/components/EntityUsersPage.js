import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BackToHomeButton from './BackToHomeButton';

const ROLE_OPTIONS = ['admin', 'approver', 'general'];

const EntityUsersPage = ({ entityId }) => {
  const [users, setUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/entity/user/list/', {
        entity_id: entityId,
      });
      if (res.data.status === 'success') {
        setUsers(res.data.users.data);
      }
    } catch (err) {
      console.error('Error fetching entity users:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail) return;
    try {
      await axios.post('http://localhost:8000/api/entity/user/create/', {
        email: newUserEmail,
        name: newUserEmail.split('@')[0],
        roles: [newUserRole],
        entity_id: entityId,
      });
      setNewUserEmail('');
      setNewUserRole('admin');
      fetchUsers();
    } catch (err) {
      console.error('Error creating entity user:', err);
    }
  };

  const updateUser = async () => {
    try {
      await axios.post('http://localhost:8000/api/entity/user/update/', {
        user_id: editingUser.id,
        email: editingUser.email,
        name: editingUser.name,
        roles: [editingUser.role],
        entity_id: entityId,
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating entity user:', err);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axios.post('http://localhost:8000/api/entity/user/delete/', {
        user_id: userId, 
        entity_id: entityId,
      });
      fetchUsers();
    } catch (err) {
      console.error('Error deleting entity user:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [entityId]);

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-lg rounded-xl mt-10">
      <BackToHomeButton />
      <h2 className="text-3xl font-bold mb-6 text-indigo-800">Manage Users</h2>

      {/* New User Form */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="email"
          placeholder="Enter user email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          className="flex-1 border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
        <select
          value={newUserRole}
          onChange={(e) => setNewUserRole(e.target.value)}
          className="border border-gray-300 p-3 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
        >
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <button
          onClick={createUser}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md shadow transition"
        >
          Add User
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-indigo-100 text-indigo-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    {editingUser?.id === user.id ? (
                      <input
                        type="text"
                        value={editingUser.email}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, email: e.target.value })
                        }
                        className="w-full border border-gray-300 p-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {editingUser?.id === user.id ? (
                      <input
                        type="text"
                        value={editingUser.name || ''}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, name: e.target.value })
                        }
                        className="w-full border border-gray-300 p-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    ) : (
                      user.name || '—'
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {editingUser?.id === user.id ? (
                      <select
                        value={editingUser.role}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, role: e.target.value })
                        }
                        className="w-full border border-gray-300 p-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      user.roles[0] || '—'
                    )}
                  </td>
                  <td className="px-6 py-3 text-right space-x-4">
                    {editingUser?.id === user.id ? (
                      <>
                        <button
                          onClick={updateUser}
                          className="text-green-600 hover:underline font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-gray-600 hover:underline font-medium"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            setEditingUser({ ...user, role: user.roles[0] || 'general' })
                          }
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EntityUsersPage;
