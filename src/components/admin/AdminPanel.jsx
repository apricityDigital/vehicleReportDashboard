import React, { useState, useEffect } from 'react';
import { getPendingUsers, approveUser, rejectUser, USER_STATUS, testFirebaseConnection } from '../../services/authService';

const AdminPanel = ({ currentUser, onClose }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      console.log('AdminPanel: Loading pending users...');
      console.log('Current user:', currentUser);

      const users = await getPendingUsers();
      console.log('AdminPanel: Received users:', users);

      setPendingUsers(users);
      setDebugInfo({
        userCount: users.length,
        currentUserRole: currentUser?.role,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AdminPanel: Error loading pending users:', error);
      setError({
        message: error.message || 'Failed to load pending users',
        code: error.code || 'unknown',
        details: error.toString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionLoading({ ...actionLoading, [userId]: 'approving' });
    try {
      const result = await approveUser(userId, currentUser.uid);
      if (result.success) {
        // Remove from pending list
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Error approving user:', error);
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null });
    }
  };

  const handleReject = async (userId) => {
    setActionLoading({ ...actionLoading, [userId]: 'rejecting' });
    try {
      const result = await rejectUser(userId, currentUser.uid);
      if (result.success) {
        // Remove from pending list
        setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null });
    }
  };

  const runConnectionTest = async () => {
    console.log('Running Firebase connection test...');
    const results = await testFirebaseConnection();
    setTestResults(results);
    console.log('Test results:', results);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Admin Panel</h2>
              <p className="text-blue-100 text-sm sm:text-base">Manage user access requests</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 touch-manipulation"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-120px)]">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-red-800 font-medium">Error Loading Pending Users</h4>
                  <p className="text-red-700 text-sm mt-1">{error.message}</p>
                  {error.code && (
                    <p className="text-red-600 text-xs mt-1">Error Code: {error.code}</p>
                  )}
                  <button
                    onClick={loadPendingUsers}
                    className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info (only in development) */}
          {debugInfo && process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <h4 className="font-medium text-blue-800 mb-1">Debug Info:</h4>
              <pre className="text-blue-700">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          {/* Test Results (only in development) */}
          {testResults && process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs">
              <h4 className="font-medium text-purple-800 mb-1">Firebase Connection Test:</h4>
              <pre className="text-purple-700">{JSON.stringify(testResults, null, 2)}</pre>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading pending requests...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Requests</h3>
              <p className="text-gray-600">There was an error loading pending user requests.</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
              <p className="text-gray-600">All user access requests have been processed.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Pending Access Requests ({pendingUsers.length})
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={loadPendingUsers}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium touch-manipulation"
                  >
                    Refresh
                  </button>
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={runConnectionTest}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium touch-manipulation"
                    >
                      Test Connection
                    </button>
                  )}
                </div>
              </div>

              {pendingUsers.map((user) => (
                <div key={user.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:p-6 border border-gray-200">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{user.name}</h4>
                          <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-500">Department:</span>
                          <p className="text-sm text-gray-900">{user.department}</p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-500">Requested Role:</span>
                          <p className="text-sm text-gray-900 capitalize">{user.role}</p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-500">Phone:</span>
                          <p className="text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-500">Request Date:</span>
                          <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-row lg:flex-col xl:flex-row space-x-2 sm:space-x-3 lg:space-x-0 lg:space-y-2 xl:space-y-0 xl:space-x-3 lg:ml-6">
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={actionLoading[user.id]}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm touch-manipulation min-h-[40px]"
                      >
                        {actionLoading[user.id] === 'approving' ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span className="hidden sm:inline">Approving...</span>
                            <span className="sm:hidden">...</span>
                          </div>
                        ) : (
                          'Approve'
                        )}
                      </button>

                      <button
                        onClick={() => handleReject(user.id)}
                        disabled={actionLoading[user.id]}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm touch-manipulation min-h-[40px]"
                      >
                        {actionLoading[user.id] === 'rejecting' ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span className="hidden sm:inline">Rejecting...</span>
                            <span className="sm:hidden">...</span>
                          </div>
                        ) : (
                          'Reject'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
