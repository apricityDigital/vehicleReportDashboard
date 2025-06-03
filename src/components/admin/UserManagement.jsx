import React, { useState, useEffect } from 'react';
import {
  getAllUsers,
  getUsersByStatus,
  approveUser,
  rejectUser,
  suspendUser,
  reactivateUser,
  updateUserRole,
  bulkApproveUsers,
  bulkRejectUsers,
  deleteUser,
  bulkDeleteUsers,
  searchUsers,
  USER_STATUS,
  USER_ROLES
} from '../../services/authService';

const UserManagement = ({ currentUser, stats, setStats }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    role: 'all',
    search: ''
  });
  const [actionLoading, setActionLoading] = useState({});
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      
      // Update stats
      const newStats = {
        totalUsers: allUsers.length,
        pendingUsers: allUsers.filter(u => u.status === USER_STATUS.PENDING).length,
        approvedUsers: allUsers.filter(u => u.status === USER_STATUS.APPROVED).length,
        suspendedUsers: allUsers.filter(u => u.status === USER_STATUS.SUSPENDED).length
      };
      setStats(newStats);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.department?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (action, userId, additionalData = {}) => {
    setActionLoading({ ...actionLoading, [userId]: action });
    try {
      let result;
      switch (action) {
        case 'approve':
          result = await approveUser(userId, currentUser.uid);
          break;
        case 'reject':
          result = await rejectUser(userId, currentUser.uid);
          break;
        case 'suspend':
          result = await suspendUser(userId, currentUser.uid, additionalData.reason);
          break;
        case 'reactivate':
          result = await reactivateUser(userId, currentUser.uid);
          break;
        case 'updateRole':
          result = await updateUserRole(userId, additionalData.role, currentUser.uid);
          break;
        case 'delete':
          result = await deleteUser(userId, currentUser.uid, additionalData.reason);
          break;
      }

      if (result.success) {
        await loadUsers(); // Reload users to get updated data
        if (action === 'delete') {
          alert(`User ${result.deletedUser.name} (${result.deletedUser.email}) has been permanently deleted.`);
        }
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      alert(`Error ${action} user: ${error.message}`);
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null });
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    // Extra confirmation for bulk delete
    if (action === 'delete') {
      const confirmMessage = `⚠️ DANGER: You are about to permanently delete ${selectedUsers.length} users. This action cannot be undone.\n\nType "DELETE" to confirm:`;
      const confirmation = prompt(confirmMessage);
      if (confirmation !== 'DELETE') {
        alert('Bulk delete cancelled.');
        return;
      }
    }

    try {
      let result;
      if (action === 'approve') {
        result = await bulkApproveUsers(selectedUsers, currentUser.uid);
      } else if (action === 'reject') {
        result = await bulkRejectUsers(selectedUsers, currentUser.uid);
      } else if (action === 'delete') {
        const reason = prompt('Please provide a reason for bulk deletion:') || 'Bulk admin action';
        result = await bulkDeleteUsers(selectedUsers, currentUser.uid, reason);
      }

      if (result.success) {
        setSelectedUsers([]);
        await loadUsers();
        if (action === 'delete') {
          alert(`Successfully deleted ${result.deletedUsers.length} users.${result.errors.length > 0 ? ` ${result.errors.length} deletions failed.` : ''}`);
        }
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error bulk ${action}:`, error);
      alert(`Error bulk ${action}: ${error.message}`);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete || !deleteReason.trim()) {
      alert('Please provide a reason for deletion.');
      return;
    }

    await handleUserAction('delete', userToDelete.id, { reason: deleteReason });
    setShowDeleteModal(false);
    setUserToDelete(null);
    setDeleteReason('');
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
    setDeleteReason('');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      [USER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [USER_STATUS.APPROVED]: 'bg-green-100 text-green-800',
      [USER_STATUS.REJECTED]: 'bg-red-100 text-red-800',
      [USER_STATUS.SUSPENDED]: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getRoleBadge = (role) => {
    const badges = {
      [USER_ROLES.ADMIN]: 'bg-purple-100 text-purple-800',
      [USER_ROLES.OPERATOR]: 'bg-blue-100 text-blue-800',
      [USER_ROLES.VIEWER]: 'bg-gray-100 text-gray-800'
    };
    return badges[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value={USER_STATUS.PENDING}>Pending</option>
            <option value={USER_STATUS.APPROVED}>Approved</option>
            <option value={USER_STATUS.REJECTED}>Rejected</option>
            <option value={USER_STATUS.SUSPENDED}>Suspended</option>
          </select>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value={USER_ROLES.ADMIN}>Admin</option>
            <option value={USER_ROLES.OPERATOR}>Operator</option>
            <option value={USER_ROLES.VIEWER}>Viewer</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 p-4 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-800 font-medium">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="admin-button px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Bulk Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="admin-button px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Bulk Reject
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="admin-button px-3 py-1 bg-gray-800 text-white rounded text-sm hover:bg-gray-900 border-2 border-red-500"
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Bulk Delete
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="admin-button px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden admin-card-hover">
        <div className="overflow-x-auto admin-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 admin-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${getStatusBadge(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {user.status === USER_STATUS.PENDING && (
                      <>
                        <button
                          onClick={() => handleUserAction('approve', user.id)}
                          disabled={actionLoading[user.id]}
                          className="admin-button px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUserAction('reject', user.id)}
                          disabled={actionLoading[user.id]}
                          className="admin-button px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {user.status === USER_STATUS.APPROVED && (
                      <button
                        onClick={() => handleUserAction('suspend', user.id, { reason: 'Admin action' })}
                        disabled={actionLoading[user.id]}
                        className="admin-button px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    )}
                    {user.status === USER_STATUS.SUSPENDED && (
                      <button
                        onClick={() => handleUserAction('reactivate', user.id)}
                        disabled={actionLoading[user.id]}
                        className="admin-button px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="admin-button px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(user)}
                      disabled={actionLoading[user.id]}
                      className="admin-button px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-900 border border-red-500 disabled:opacity-50"
                      title="Delete User (Permanent)"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600">No users match your current filters.</p>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 admin-modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-white hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] admin-scrollbar">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h4>
                    <p className="text-gray-600">{selectedUser.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => {
                        setSelectedUser(prev => ({ ...prev, role: e.target.value }));
                        handleUserAction('updateRole', selectedUser.id, { role: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={USER_ROLES.ADMIN}>Admin</option>
                      <option value={USER_ROLES.OPERATOR}>Operator</option>
                      <option value={USER_ROLES.VIEWER}>Viewer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <p className="text-gray-900">{selectedUser.department}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <p className="text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created Date</label>
                    <p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                    <p className="text-gray-900">{formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </div>

                {selectedUser.approvedBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Approved By</label>
                    <p className="text-gray-900">{selectedUser.approvedBy} on {formatDate(selectedUser.approvedAt)}</p>
                  </div>
                )}

                {selectedUser.suspensionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Suspension Reason</label>
                    <p className="text-gray-900">{selectedUser.suspensionReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 admin-modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 rounded-lg p-2 mr-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">⚠️ Delete User</h3>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{userToDelete.name}</h4>
                    <p className="text-gray-600 text-sm">{userToDelete.email}</p>
                    <p className="text-gray-500 text-xs">{userToDelete.department} • {userToDelete.role}</p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h4 className="text-red-800 font-medium text-sm">Warning: Permanent Deletion</h4>
                      <ul className="text-red-700 text-xs mt-1 space-y-1">
                        <li>• User account will be permanently deleted</li>
                        <li>• All user data will be removed from the system</li>
                        <li>• User will lose access immediately</li>
                        <li>• This action cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for deletion <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Please provide a detailed reason for deleting this user..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    rows="3"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={!deleteReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
