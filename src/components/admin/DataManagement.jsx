import React, { useState, useEffect } from 'react';
import { getAllUsers } from '../../services/authService';

const DataManagement = ({ currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [dataSourceConfig, setDataSourceConfig] = useState({
    dataSources: JSON.parse(localStorage.getItem('dataSources') || JSON.stringify([
      {
        id: 1,
        name: 'Primary Source',
        url: '',
        priority: 1,
        status: 'active',
        description: 'Main live data source'
      }
    ])),
    refreshInterval: localStorage.getItem('refreshInterval') || '300000', // 5 minutes
    autoRefresh: localStorage.getItem('autoRefresh') === 'true',
    enableFailover: localStorage.getItem('enableFailover') === 'true',
    failoverTimeout: localStorage.getItem('failoverTimeout') || '10000' // 10 seconds
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

  const addDataSource = () => {
    const newSource = {
      id: Date.now(),
      name: `Backup Source ${dataSourceConfig.dataSources.length}`,
      url: '',
      priority: dataSourceConfig.dataSources.length + 1,
      status: 'inactive',
      description: 'Backup data source'
    };

    setDataSourceConfig(prev => ({
      ...prev,
      dataSources: [...prev.dataSources, newSource]
    }));
  };

  const removeDataSource = (id) => {
    if (dataSourceConfig.dataSources.length <= 1) {
      alert('Cannot remove the last data source!');
      return;
    }

    setDataSourceConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.filter(source => source.id !== id)
    }));
  };

  const updateDataSource = (id, field, value) => {
    setDataSourceConfig(prev => ({
      ...prev,
      dataSources: prev.dataSources.map(source =>
        source.id === id ? { ...source, [field]: value } : source
      )
    }));
  };

  const moveDataSource = (id, direction) => {
    const sources = [...dataSourceConfig.dataSources];
    const index = sources.findIndex(s => s.id === id);

    if (direction === 'up' && index > 0) {
      [sources[index], sources[index - 1]] = [sources[index - 1], sources[index]];
    } else if (direction === 'down' && index < sources.length - 1) {
      [sources[index], sources[index + 1]] = [sources[index + 1], sources[index]];
    }

    // Update priorities
    sources.forEach((source, idx) => {
      source.priority = idx + 1;
    });

    setDataSourceConfig(prev => ({ ...prev, dataSources: sources }));
  };

  const testDataSource = async (url) => {
    if (!url) {
      alert('Please enter a URL first');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(url);
      if (response.ok) {
        alert('✅ Data source is accessible!');
        return true;
      } else {
        alert('❌ Data source is not accessible');
        return false;
      }
    } catch (error) {
      alert('❌ Error testing data source: ' + error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDataSourceUpdate = () => {
    localStorage.setItem('dataSources', JSON.stringify(dataSourceConfig.dataSources));
    localStorage.setItem('refreshInterval', dataSourceConfig.refreshInterval);
    localStorage.setItem('autoRefresh', dataSourceConfig.autoRefresh.toString());
    localStorage.setItem('enableFailover', dataSourceConfig.enableFailover.toString());
    localStorage.setItem('failoverTimeout', dataSourceConfig.failoverTimeout);
    alert('Multi-source data configuration updated successfully!');
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

        {/* Multi-Source Data Configuration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Multi-Source Data Configuration</h3>
              <p className="text-gray-600 text-sm">Configure multiple Google Sheets with automatic failover</p>
            </div>
            <button
              onClick={addDataSource}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Source
            </button>
          </div>

          {/* Failover Settings */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-3">Failover Settings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableFailover"
                  checked={dataSourceConfig.enableFailover}
                  onChange={(e) => setDataSourceConfig(prev => ({ ...prev, enableFailover: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableFailover" className="ml-2 block text-sm text-blue-800">
                  Enable Automatic Failover
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  Failover Timeout
                </label>
                <select
                  value={dataSourceConfig.failoverTimeout}
                  onChange={(e) => setDataSourceConfig(prev => ({ ...prev, failoverTimeout: e.target.value }))}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="5000">5 seconds</option>
                  <option value="10000">10 seconds</option>
                  <option value="15000">15 seconds</option>
                  <option value="30000">30 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  Refresh Interval
                </label>
                <select
                  value={dataSourceConfig.refreshInterval}
                  onChange={(e) => setDataSourceConfig(prev => ({ ...prev, refreshInterval: e.target.value }))}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="60000">1 minute</option>
                  <option value="300000">5 minutes</option>
                  <option value="600000">10 minutes</option>
                  <option value="1800000">30 minutes</option>
                  <option value="3600000">1 hour</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Sources List */}
          <div className="space-y-4 mb-6">
            {dataSourceConfig.dataSources.map((source, index) => (
              <div key={source.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${source.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="font-medium text-gray-900">Priority {source.priority}</span>
                    {index === 0 && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Primary</span>}
                    {index > 0 && <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Backup</span>}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => moveDataSource(source.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Move Up"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDataSource(source.id, 'down')}
                      disabled={index === dataSourceConfig.dataSources.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title="Move Down"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeDataSource(source.id)}
                      disabled={dataSourceConfig.dataSources.length <= 1}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                      title="Remove Source"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Name
                    </label>
                    <input
                      type="text"
                      value={source.name}
                      onChange={(e) => updateDataSource(source.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={source.description}
                      onChange={(e) => updateDataSource(source.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Sheets URL
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={source.url}
                      onChange={(e) => updateDataSource(source.id, 'url', e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                      onClick={() => testDataSource(source.url)}
                      disabled={loading || !source.url}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      Test
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Global Settings */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
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

              <button
                onClick={handleDataSourceUpdate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Configuration
              </button>
            </div>
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
