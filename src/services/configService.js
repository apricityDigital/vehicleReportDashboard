import { doc, setDoc, getDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configuration keys
export const CONFIG_KEYS = {
  APP_NAME: 'appName',
  APP_DESCRIPTION: 'appDescription',
  THEME: 'theme',
  GOOGLE_SHEETS_URL: 'googleSheetsUrl',
  REFRESH_INTERVAL: 'refreshInterval',
  AUTO_REFRESH: 'autoRefresh',
  ENABLE_NOTIFICATIONS: 'enableNotifications',
  MAINTENANCE_MODE: 'maintenanceMode',
  MAX_LOGIN_ATTEMPTS: 'maxLoginAttempts',
  SESSION_TIMEOUT: 'sessionTimeout',
  ENABLE_AUDIT_LOG: 'enableAuditLog',
  AUTO_BACKUP: 'autoBackup',
  LAST_BACKUP: 'lastBackup'
};

// Default configuration values
export const DEFAULT_CONFIG = {
  [CONFIG_KEYS.APP_NAME]: 'IMC ICCC Dashboard',
  [CONFIG_KEYS.APP_DESCRIPTION]: 'Daily Vehicle Report Dashboard',
  [CONFIG_KEYS.THEME]: 'blue',
  [CONFIG_KEYS.GOOGLE_SHEETS_URL]: '',
  [CONFIG_KEYS.REFRESH_INTERVAL]: '300000', // 5 minutes
  [CONFIG_KEYS.AUTO_REFRESH]: false,
  [CONFIG_KEYS.ENABLE_NOTIFICATIONS]: false,
  [CONFIG_KEYS.MAINTENANCE_MODE]: false,
  [CONFIG_KEYS.MAX_LOGIN_ATTEMPTS]: '5',
  [CONFIG_KEYS.SESSION_TIMEOUT]: '3600000', // 1 hour
  [CONFIG_KEYS.ENABLE_AUDIT_LOG]: false,
  [CONFIG_KEYS.AUTO_BACKUP]: false,
  [CONFIG_KEYS.LAST_BACKUP]: null
};

// Get system configuration
export const getSystemConfig = async () => {
  try {
    const configDoc = await getDoc(doc(db, 'system', 'config'));
    
    if (configDoc.exists()) {
      const data = configDoc.data();
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_CONFIG, ...data };
    } else {
      // Create default config if it doesn't exist
      await setDoc(doc(db, 'system', 'config'), {
        ...DEFAULT_CONFIG,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('Error getting system config:', error);
    // Fallback to localStorage if Firestore fails
    return getLocalConfig();
  }
};

// Update system configuration
export const updateSystemConfig = async (updates, adminId) => {
  try {
    const configRef = doc(db, 'system', 'config');
    await updateDoc(configRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: adminId
    });
    
    // Also update localStorage for immediate effect
    Object.entries(updates).forEach(([key, value]) => {
      localStorage.setItem(key, value.toString());
    });
    
    return { success: true, message: 'Configuration updated successfully' };
  } catch (error) {
    console.error('Error updating system config:', error);
    
    // Fallback to localStorage
    Object.entries(updates).forEach(([key, value]) => {
      localStorage.setItem(key, value.toString());
    });
    
    return { success: false, message: error.message };
  }
};

// Get configuration from localStorage (fallback)
export const getLocalConfig = () => {
  const config = {};
  Object.entries(DEFAULT_CONFIG).forEach(([key, defaultValue]) => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      // Parse boolean values
      if (typeof defaultValue === 'boolean') {
        config[key] = stored === 'true';
      } else {
        config[key] = stored;
      }
    } else {
      config[key] = defaultValue;
    }
  });
  return config;
};

// Save configuration to localStorage
export const saveLocalConfig = (config) => {
  Object.entries(config).forEach(([key, value]) => {
    localStorage.setItem(key, value.toString());
  });
};

// Reset configuration to defaults
export const resetSystemConfig = async (adminId) => {
  try {
    const configRef = doc(db, 'system', 'config');
    await updateDoc(configRef, {
      ...DEFAULT_CONFIG,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
      resetAt: serverTimestamp()
    });
    
    // Clear localStorage
    Object.keys(DEFAULT_CONFIG).forEach(key => {
      localStorage.removeItem(key);
    });
    
    return { success: true, message: 'Configuration reset to defaults' };
  } catch (error) {
    console.error('Error resetting system config:', error);
    
    // Fallback to localStorage reset
    Object.keys(DEFAULT_CONFIG).forEach(key => {
      localStorage.removeItem(key);
    });
    
    return { success: false, message: error.message };
  }
};

// Get specific configuration value
export const getConfigValue = async (key) => {
  try {
    const config = await getSystemConfig();
    return config[key] || DEFAULT_CONFIG[key];
  } catch (error) {
    console.error('Error getting config value:', error);
    return localStorage.getItem(key) || DEFAULT_CONFIG[key];
  }
};

// Set specific configuration value
export const setConfigValue = async (key, value, adminId) => {
  try {
    const updates = { [key]: value };
    return await updateSystemConfig(updates, adminId);
  } catch (error) {
    console.error('Error setting config value:', error);
    localStorage.setItem(key, value.toString());
    return { success: false, message: error.message };
  }
};

// Validate configuration
export const validateConfig = (config) => {
  const errors = [];
  
  // Validate required fields
  if (!config[CONFIG_KEYS.APP_NAME] || config[CONFIG_KEYS.APP_NAME].trim() === '') {
    errors.push('App name is required');
  }
  
  // Validate numeric fields
  const numericFields = [CONFIG_KEYS.REFRESH_INTERVAL, CONFIG_KEYS.SESSION_TIMEOUT];
  numericFields.forEach(field => {
    const value = parseInt(config[field]);
    if (isNaN(value) || value <= 0) {
      errors.push(`${field} must be a positive number`);
    }
  });
  
  // Validate max login attempts
  const maxAttempts = config[CONFIG_KEYS.MAX_LOGIN_ATTEMPTS];
  if (maxAttempts !== 'unlimited') {
    const attempts = parseInt(maxAttempts);
    if (isNaN(attempts) || attempts <= 0) {
      errors.push('Max login attempts must be a positive number or "unlimited"');
    }
  }
  
  // Validate Google Sheets URL if provided
  if (config[CONFIG_KEYS.GOOGLE_SHEETS_URL]) {
    try {
      new URL(config[CONFIG_KEYS.GOOGLE_SHEETS_URL]);
    } catch {
      errors.push('Google Sheets URL must be a valid URL');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export configuration for backup
export const exportConfig = async () => {
  try {
    const config = await getSystemConfig();
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      config: config,
      metadata: {
        exportedAt: new Date().toISOString(),
        type: 'system_configuration'
      }
    };
    
    return exportData;
  } catch (error) {
    console.error('Error exporting config:', error);
    throw error;
  }
};

// Import configuration from backup
export const importConfig = async (configData, adminId) => {
  try {
    if (!configData.config) {
      throw new Error('Invalid configuration data');
    }
    
    const validation = validateConfig(configData.config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }
    
    const result = await updateSystemConfig(configData.config, adminId);
    if (result.success) {
      return { success: true, message: 'Configuration imported successfully' };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error importing config:', error);
    return { success: false, message: error.message };
  }
};

// Get configuration history (if audit logging is enabled)
export const getConfigHistory = async (limit = 50) => {
  try {
    const historyRef = collection(db, 'system', 'config', 'history');
    const querySnapshot = await getDocs(historyRef);
    
    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return history.sort((a, b) => {
      const aTime = a.timestamp?.seconds || 0;
      const bTime = b.timestamp?.seconds || 0;
      return bTime - aTime;
    }).slice(0, limit);
  } catch (error) {
    console.error('Error getting config history:', error);
    return [];
  }
};
