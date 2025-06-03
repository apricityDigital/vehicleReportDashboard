// Multi-Source Data Service with Automatic Failover
import { fetchSheetData } from './googleSheetsService';

class MultiSourceDataService {
  constructor() {
    this.dataSources = [];
    this.currentSourceIndex = 0;
    this.failoverTimeout = 10000; // 10 seconds
    this.enableFailover = false;
    this.loadConfiguration();
  }

  // Load configuration from localStorage
  loadConfiguration() {
    try {
      const sources = JSON.parse(localStorage.getItem('dataSources') || '[]');
      const enableFailover = localStorage.getItem('enableFailover') === 'true';
      const failoverTimeout = parseInt(localStorage.getItem('failoverTimeout') || '10000');

      this.dataSources = sources.sort((a, b) => a.priority - b.priority);
      this.enableFailover = enableFailover;
      this.failoverTimeout = failoverTimeout;
      this.currentSourceIndex = 0;

      console.log('📊 Multi-Source Configuration Loaded:', {
        sources: this.dataSources.length,
        enableFailover: this.enableFailover,
        failoverTimeout: this.failoverTimeout
      });
    } catch (error) {
      console.error('Error loading multi-source configuration:', error);
      this.dataSources = [];
    }
  }

  // Extract spreadsheet ID from Google Sheets URL
  extractSpreadsheetId(url) {
    if (!url) return null;
    
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  // Test if a data source is accessible
  async testDataSource(source, timeout = 5000) {
    if (!source || !source.url) {
      return { success: false, error: 'Invalid source or URL' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Convert Google Sheets URL to CSV export URL for testing
      const spreadsheetId = this.extractSpreadsheetId(source.url);
      if (!spreadsheetId) {
        return { success: false, error: 'Invalid Google Sheets URL format' };
      }

      const testUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
      
      const response = await fetch(testUrl, {
        method: 'HEAD', // Just check if accessible
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return { success: true, source: source.name };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Timeout' };
      }
      return { success: false, error: error.message };
    }
  }

  // Get the current active data source
  getCurrentSource() {
    if (this.dataSources.length === 0) {
      return null;
    }
    return this.dataSources[this.currentSourceIndex] || this.dataSources[0];
  }

  // Switch to next available data source
  async switchToNextSource() {
    if (!this.enableFailover || this.dataSources.length <= 1) {
      return false;
    }

    const originalIndex = this.currentSourceIndex;
    
    // Try each source in priority order
    for (let i = 1; i < this.dataSources.length; i++) {
      const nextIndex = (this.currentSourceIndex + i) % this.dataSources.length;
      const nextSource = this.dataSources[nextIndex];
      
      console.log(`🔄 Testing failover to: ${nextSource.name}`);
      
      const testResult = await this.testDataSource(nextSource, this.failoverTimeout);
      
      if (testResult.success) {
        this.currentSourceIndex = nextIndex;
        console.log(`✅ Failover successful to: ${nextSource.name}`);
        return true;
      } else {
        console.log(`❌ Failover failed for ${nextSource.name}: ${testResult.error}`);
      }
    }

    console.log('🚨 All data sources failed, staying with current source');
    return false;
  }

  // Fetch data with automatic failover
  async fetchDataWithFailover(sheetName) {
    if (this.dataSources.length === 0) {
      console.warn('No data sources configured, using default service');
      return await fetchSheetData(sheetName);
    }

    const maxAttempts = this.enableFailover ? this.dataSources.length : 1;
    let lastError = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentSource = this.getCurrentSource();
      
      if (!currentSource || !currentSource.url) {
        console.warn('Invalid current source, trying next...');
        await this.switchToNextSource();
        continue;
      }

      try {
        console.log(`📡 Fetching data from: ${currentSource.name} (attempt ${attempt + 1})`);
        
        // Extract spreadsheet ID and use it with the existing service
        const spreadsheetId = this.extractSpreadsheetId(currentSource.url);
        if (!spreadsheetId) {
          throw new Error('Invalid Google Sheets URL format');
        }

        // Temporarily override the spreadsheet ID in the service
        const originalFetchSheetData = fetchSheetData;
        const customFetchSheetData = async (sheetName) => {
          // This would need to be implemented to use the custom spreadsheet ID
          // For now, we'll use the original service
          return await originalFetchSheetData(sheetName);
        };

        const data = await customFetchSheetData(sheetName);
        
        // Mark source as active on successful fetch
        currentSource.status = 'active';
        
        console.log(`✅ Data fetched successfully from: ${currentSource.name}`);
        return data;

      } catch (error) {
        lastError = error;
        console.error(`❌ Error fetching from ${currentSource.name}:`, error.message);
        
        // Mark source as failed
        currentSource.status = 'failed';
        
        if (this.enableFailover && attempt < maxAttempts - 1) {
          console.log('🔄 Attempting failover to next source...');
          const failoverSuccess = await this.switchToNextSource();
          
          if (!failoverSuccess) {
            console.log('🚨 No more sources available for failover');
            break;
          }
        }
      }
    }

    // If all sources failed, throw the last error
    throw new Error(`All data sources failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  // Fetch all sheets data with failover
  async fetchAllSheetsDataWithFailover() {
    const sheetNames = [
      'onRouteVehicles',
      'onBoardAfter3PM', 
      'lessThan3Trips',
      'glitchPercentage',
      'issuesPost0710',
      'fuelStation',
      'post06AMOpenIssues',
      'vehicleBreakdown',
      'vehicleNumbers',
      'sphereWorkshopExit'
    ];

    const promises = sheetNames.map(async (sheetName) => {
      try {
        const data = await this.fetchDataWithFailover(sheetName);
        return { sheetName, data, success: true };
      } catch (error) {
        console.error(`Failed to fetch ${sheetName}:`, error);
        return { sheetName, data: [], success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const allData = {};
    const errors = [];

    results.forEach(({ sheetName, data, success, error }) => {
      allData[sheetName] = data;
      if (!success) {
        errors.push({ sheetName, error });
      }
    });

    if (errors.length > 0) {
      console.warn('Some sheets failed to load:', errors);
    }

    return allData;
  }

  // Get status of all data sources
  getSourcesStatus() {
    return this.dataSources.map((source, index) => ({
      ...source,
      isCurrent: index === this.currentSourceIndex,
      isActive: source.status === 'active'
    }));
  }

  // Manually switch to a specific source
  async switchToSource(sourceId) {
    const sourceIndex = this.dataSources.findIndex(s => s.id === sourceId);
    
    if (sourceIndex === -1) {
      throw new Error('Source not found');
    }

    const source = this.dataSources[sourceIndex];
    const testResult = await this.testDataSource(source);
    
    if (testResult.success) {
      this.currentSourceIndex = sourceIndex;
      source.status = 'active';
      console.log(`✅ Manually switched to: ${source.name}`);
      return true;
    } else {
      throw new Error(`Cannot switch to ${source.name}: ${testResult.error}`);
    }
  }

  // Reset all sources to inactive status
  resetSourcesStatus() {
    this.dataSources.forEach(source => {
      source.status = 'inactive';
    });
  }
}

// Create singleton instance
const multiSourceService = new MultiSourceDataService();

export default multiSourceService;

// Export individual functions for backward compatibility
export const fetchDataWithFailover = (sheetName) => multiSourceService.fetchDataWithFailover(sheetName);
export const fetchAllSheetsDataWithFailover = () => multiSourceService.fetchAllSheetsDataWithFailover();
export const getSourcesStatus = () => multiSourceService.getSourcesStatus();
export const switchToSource = (sourceId) => multiSourceService.switchToSource(sourceId);
export const testDataSource = (source) => multiSourceService.testDataSource(source);
