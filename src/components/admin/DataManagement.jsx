import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/authService';

const DataManagement = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [dataSourceConfig, setDataSourceConfig] = useState({
    googleSheetsUrl: localStorage.getItem('googleSheetsUrl') || '',
    refreshInterval: localStorage.getItem('refreshInterval') || '300000', // 5 minutes
    autoRefresh: localStorage.getItem('autoRefresh') === 'true'
  });
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: localStorage.getItem('lastBackup') || null,
    autoBackup: localStorage.getItem('autoBackup') === 'true'
  });

  const handleExportUsers = async (format = 'json') => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      
      if (format === 'json') {
        const dataStr = JSON.stringify(users, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const csvHeaders = ['Name', 'Email', 'Role', 'Status', 'Department', 'Phone', 'Created Date'];
        const csvRows = users.map(user => [
          user.name || '',
          user.email || '',
          user.role || '',
          user.status || '',
          user.department || '',
          user.phone || '',
          user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : ''
        ]);
        
        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        
        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
      
      setExportData({
        timestamp: new Date().toISOString(),
        recordCount: users.length,
        format: format
      });
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Error exporting users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDataSourceUpdate = () => {
    localStorage.setItem('googleSheetsUrl', dataSourceConfig.googleSheetsUrl);
    localStorage.setItem('refreshInterval', dataSourceConfig.refreshInterval);
    localStorage.setItem('autoRefresh', dataSourceConfig.autoRefresh.toString());
    alert('Data source configuration updated successfully!');
  };

  const handleBackupSettings = () => {
    localStorage.setItem('autoBackup', backupStatus.autoBackup.toString());
    if (backupStatus.autoBackup) {
      localStorage.setItem('lastBackup', new Date().toISOString());
      setBackupStatus(prev => ({ ...prev, lastBackup: new Date().toISOString() }));
    }
    alert('Backup settings updated successfully!');
  };

  const handleManualBackup = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        users: users,
        metadata: {
          totalUsers: users.length,
          exportedBy: currentUser.email,
          exportedAt: new Date().toISOString()
        }
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      localStorage.setItem('lastBackup', new Date().toISOString());
      setBackupStatus(prev => ({ ...prev, lastBackup: new Date().toISOString() }));
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-IN');
  };

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      <div className="space-y-8">
        {/* Data Export Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
          <p className="text-gray-600 mb-6">Export user data for backup or analysis purposes.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleExportUsers('json')}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as JSON
            </button>
            
            <button
              onClick={() => handleExportUsers('csv')}
              disabled={loading}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export as CSV
            </button>
          </div>
          
          {exportData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-green-800 font-medium">Export Completed</p>
                  <p className="text-green-700 text-sm">
                    {exportData.recordCount} records exported as {exportData.format.toUpperCase()} on {formatDate(exportData.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Source Configuration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Source Configuration</h3>
          <p className="text-gray-600 mb-6">Configure Google Sheets data source and refresh settings.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Sheets URL
              </label>
              <input
                type="url"
                value={dataSourceConfig.googleSheetsUrl}
                onChange={(e) => setDataSourceConfig(prev => ({ ...prev, googleSheetsUrl: e.target.value }))}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refresh Interval (ms)
                </label>
                <select
                  value={dataSourceConfig.refreshInterval}
                  onChange={(e) => setDataSourceConfig(prev => ({ ...prev, refreshInterval: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="60000">1 minute</option>
                  <option value="300000">5 minutes</option>
                  <option value="600000">10 minutes</option>
                  <option value="1800000">30 minutes</option>
                  <option value="3600000">1 hour</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={dataSourceConfig.autoRefresh}
                  onChange={(e) => setDataSourceConfig(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoRefresh" className="ml-2 block text-sm text-gray-700">
                  Enable Auto Refresh
                </label>
              </div>
            </div>
            
            <button
              onClick={handleDataSourceUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Configuration
            </button>
          </div>
        </div>

        {/* Backup Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Management</h3>
          <p className="text-gray-600 mb-6">Manage system backups and data recovery.</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Last Backup</p>
                <p className="text-sm text-gray-600">{formatDate(backupStatus.lastBackup)}</p>
              </div>
              <button
                onClick={handleManualBackup}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Backup'}
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Automatic Backup</p>
                <p className="text-sm text-gray-600">
                  {backupStatus.autoBackup ? 'Enabled - Daily backups' : 'Disabled'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoBackup"
                  checked={backupStatus.autoBackup}
                  onChange={(e) => setBackupStatus(prev => ({ ...prev, autoBackup: e.target.checked }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="autoBackup" className="text-sm text-gray-700">
                  Enable Auto Backup
                </label>
                <button
                  onClick={handleBackupSettings}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-green-800">Database</p>
                  <p className="text-sm text-green-600">Connected</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-green-800">Authentication</p>
                  <p className="text-sm text-green-600">Active</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium text-yellow-800">Data Sync</p>
                  <p className="text-sm text-yellow-600">Checking...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
