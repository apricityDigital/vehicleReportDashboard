import React, { useState, useEffect } from 'react';
import { validateFirebaseConfig } from '../../utils/firebaseSetup';
import { applyTheme, getCurrentTheme, getAvailableThemes } from '../../utils/themeUtils';

const SystemSettings = ({ currentUser }) => {
  const [settings, setSettings] = useState({
    appName: localStorage.getItem('appName') || 'IMC ICCC Dashboard',
    appDescription: localStorage.getItem('appDescription') || 'Daily Vehicle Report Dashboard',
    theme: getCurrentTheme(),
    enableNotifications: localStorage.getItem('enableNotifications') === 'true',
    maintenanceMode: localStorage.getItem('maintenanceMode') === 'true',
    maxLoginAttempts: localStorage.getItem('maxLoginAttempts') || '5',
    sessionTimeout: localStorage.getItem('sessionTimeout') || '3600000', // 1 hour
    enableAuditLog: localStorage.getItem('enableAuditLog') === 'true'
  });

  const [firebaseStatus, setFirebaseStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkFirebaseStatus();
  }, []);

  const checkFirebaseStatus = () => {
    const status = validateFirebaseConfig();
    setFirebaseStatus(status);
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // Apply theme changes immediately for preview
    if (key === 'theme') {
      applyTheme(value);
    }
  };

  const saveSettings = () => {
    setSaving(true);
    try {
      Object.entries(settings).forEach(([key, value]) => {
        localStorage.setItem(key, value.toString());
      });

      // Apply theme changes immediately using theme utility
      applyTheme(settings.theme);

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings = {
        appName: 'IMC ICCC Dashboard',
        appDescription: 'Daily Vehicle Report Dashboard',
        theme: 'blue',
        enableNotifications: false,
        maintenanceMode: false,
        maxLoginAttempts: '5',
        sessionTimeout: '3600000',
        enableAuditLog: false
      };
      
      setSettings(defaultSettings);
      Object.entries(defaultSettings).forEach(([key, value]) => {
        localStorage.setItem(key, value.toString());
      });
      
      alert('Settings reset to default values!');
    }
  };

  const themeOptions = getAvailableThemes().map(theme => ({
    value: theme.value,
    label: `${theme.name}${theme.value === 'blue' ? ' (Default)' : ''}`,
    color: `bg-${theme.value}-500`
  }));

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto">
      <div className="space-y-8">
        {/* Application Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Name
              </label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => handleSettingChange('appName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Description
              </label>
              <input
                type="text"
                value={settings.appDescription}
                onChange={(e) => handleSettingChange('appDescription', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme Color
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themeOptions.map((theme) => (
                  <label key={theme.value} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="theme"
                      value={theme.value}
                      checked={settings.theme === theme.value}
                      onChange={(e) => handleSettingChange('theme', e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`w-6 h-6 rounded-full ${theme.color} shadow-sm`}></div>
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{theme.label}</span>
                        {settings.theme === theme.value && (
                          <div className="text-xs text-primary-600 mt-1">Currently Active</div>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Theme Preview */}
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Theme Preview</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors">
                      Primary Button
                    </button>
                    <button className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm hover:bg-primary-50 transition-colors">
                      Secondary Button
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Primary Color</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Changes are applied immediately for preview. Click "Save Settings" to persist changes.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Login Attempts
              </label>
              <select
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="3">3 attempts</option>
                <option value="5">5 attempts</option>
                <option value="10">10 attempts</option>
                <option value="unlimited">Unlimited</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout
              </label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="1800000">30 minutes</option>
                <option value="3600000">1 hour</option>
                <option value="7200000">2 hours</option>
                <option value="14400000">4 hours</option>
                <option value="28800000">8 hours</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableAuditLog"
                checked={settings.enableAuditLog}
                onChange={(e) => handleSettingChange('enableAuditLog', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableAuditLog" className="ml-2 block text-sm text-gray-700">
                Enable Audit Logging
              </label>
            </div>
          </div>
        </div>

        {/* System Features */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Features</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Notifications</p>
                <p className="text-sm text-gray-600">Enable system notifications for users</p>
              </div>
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-600">Temporarily disable user access for maintenance</p>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Firebase Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Firebase Configuration Status</h3>
          
          {firebaseStatus && (
            <div className="space-y-3">
              <div className={`p-4 rounded-lg ${firebaseStatus.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${firebaseStatus.isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className={`font-medium ${firebaseStatus.isValid ? 'text-green-800' : 'text-red-800'}`}>
                    Firebase Configuration: {firebaseStatus.isValid ? 'Valid' : 'Invalid'}
                  </p>
                </div>
                {!firebaseStatus.isValid && firebaseStatus.issues.length > 0 && (
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {firebaseStatus.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Authentication</p>
                  <p className={`text-sm ${firebaseStatus.config.hasAuth ? 'text-green-600' : 'text-red-600'}`}>
                    {firebaseStatus.config.hasAuth ? 'Initialized' : 'Not Initialized'}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Firestore</p>
                  <p className={`text-sm ${firebaseStatus.config.hasDb ? 'text-green-600' : 'text-red-600'}`}>
                    {firebaseStatus.config.hasDb ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={checkFirebaseStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Status
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            onClick={resetSettings}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
