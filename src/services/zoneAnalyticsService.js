// Zone Analytics Service - Master Dashboard Intelligence
import { fetchSheetData } from './googleSheetsService.js';

// Risk scoring weights for different issues
const RISK_WEIGHTS = {
  vehicleBreakdown: 3.0,      // High priority - operational impact
  issuesPost0710: 2.5,       // High priority - schedule delays
  post06AMOpenIssues: 2.5,   // High priority - early departures
  fuelStation: 2.0,          // Medium priority - route efficiency
  lessThan3Trips: 1.5,       // Medium priority - utilization
  onBoardAfter3PM: 1.0,      // Lower priority - end-of-day issues
  glitchPercentage: 0.5      // Lowest priority - technical issues
};

// Critical thresholds for automatic alerts
const CRITICAL_THRESHOLDS = {
  vehicleBreakdown: 5,       // 5+ breakdowns = critical
  issuesPost0710: 8,         // 8+ late arrivals = critical
  post06AMOpenIssues: 10,    // 10+ early departures = critical
  fuelStation: 15,           // 15+ fuel visits = critical
  lessThan3Trips: 20,        // 20+ underutilized vehicles = critical
  totalRiskScore: 50         // Combined risk score threshold
};

// Zone analytics class
class ZoneAnalyticsService {
  constructor() {
    this.zoneData = new Map();
    this.lastAnalysis = null;
    this.criticalZones = [];
    this.recommendations = [];
  }

  // Main analysis function
  async performZoneAnalysis() {
    console.log('🔍 Starting comprehensive zone analysis...');
    
    try {
      // Fetch data from all sources
      const dataPromises = [
        this.fetchAndProcessData('vehicleBreakdown', 'Vehicle Breakdowns'),
        this.fetchAndProcessData('issuesPost0710', 'Late Arrivals (7:10 AM)'),
        this.fetchAndProcessData('post06AMOpenIssues', 'Early Departures (6:00 AM)'),
        this.fetchAndProcessData('fuelStation', 'Fuel Station Visits'),
        this.fetchAndProcessData('lessThan3Trips', 'Low Trip Count'),
        this.fetchAndProcessData('onBoardAfter3PM', 'Late Boarding'),
        this.fetchAndProcessData('vehicleNumbers', 'General Breakdowns')
      ];

      const results = await Promise.allSettled(dataPromises);
      
      // Process successful results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          this.aggregateZoneData(result.value);
        } else {
          console.warn(`Failed to fetch data for source ${index}:`, result.reason);
        }
      });

      // Calculate risk scores and identify critical zones
      this.calculateRiskScores();
      this.identifyCriticalZones();
      this.generateRecommendations();

      this.lastAnalysis = new Date();
      console.log('✅ Zone analysis completed successfully');
      
      return this.getAnalysisResults();
      
    } catch (error) {
      console.error('❌ Error in zone analysis:', error);
      throw error;
    }
  }

  // Fetch and process data from a specific source
  async fetchAndProcessData(sheetName, displayName) {
    try {
      console.log(`📊 Fetching ${displayName} data...`);
      const rawData = await fetchSheetData(sheetName);
      
      return {
        source: sheetName,
        displayName,
        data: this.processDataByZone(rawData),
        totalRecords: rawData.length
      };
    } catch (error) {
      console.warn(`⚠️ Failed to fetch ${displayName}:`, error.message);
      return {
        source: sheetName,
        displayName,
        data: new Map(),
        totalRecords: 0,
        error: error.message
      };
    }
  }

  // Process raw data and group by zone
  processDataByZone(rawData) {
    const zoneMap = new Map();
    
    rawData.forEach(record => {
      const zone = String(record.Zone || '').trim();
      const count = parseInt(record.Count || record.TotalVehicles || 1);
      
      if (zone && !isNaN(count) && count > 0) {
        const currentCount = zoneMap.get(zone) || 0;
        zoneMap.set(zone, currentCount + count);
      }
    });
    
    return zoneMap;
  }

  // Aggregate data from all sources by zone
  aggregateZoneData(sourceData) {
    const { source, displayName, data } = sourceData;
    
    data.forEach((count, zone) => {
      if (!this.zoneData.has(zone)) {
        this.zoneData.set(zone, {
          zone,
          issues: {},
          totalIssues: 0,
          riskScore: 0,
          priority: 'LOW',
          recommendations: []
        });
      }
      
      const zoneInfo = this.zoneData.get(zone);
      zoneInfo.issues[source] = {
        count,
        displayName,
        weight: RISK_WEIGHTS[source] || 1.0
      };
      zoneInfo.totalIssues += count;
    });
  }

  // Calculate risk scores for each zone
  calculateRiskScores() {
    this.zoneData.forEach((zoneInfo, zone) => {
      let riskScore = 0;
      
      Object.entries(zoneInfo.issues).forEach(([source, issueData]) => {
        const weightedScore = issueData.count * issueData.weight;
        riskScore += weightedScore;
      });
      
      zoneInfo.riskScore = Math.round(riskScore * 10) / 10; // Round to 1 decimal
      
      // Determine priority level
      if (riskScore >= 50) {
        zoneInfo.priority = 'CRITICAL';
      } else if (riskScore >= 25) {
        zoneInfo.priority = 'HIGH';
      } else if (riskScore >= 10) {
        zoneInfo.priority = 'MEDIUM';
      } else {
        zoneInfo.priority = 'LOW';
      }
    });
  }

  // Identify zones that need immediate attention
  identifyCriticalZones() {
    this.criticalZones = [];
    
    this.zoneData.forEach((zoneInfo, zone) => {
      const issues = zoneInfo.issues;
      let isCritical = false;
      let criticalReasons = [];
      
      // Check individual thresholds
      Object.entries(CRITICAL_THRESHOLDS).forEach(([source, threshold]) => {
        if (source === 'totalRiskScore') {
          if (zoneInfo.riskScore >= threshold) {
            isCritical = true;
            criticalReasons.push(`High overall risk score (${zoneInfo.riskScore})`);
          }
        } else if (issues[source] && issues[source].count >= threshold) {
          isCritical = true;
          criticalReasons.push(`${issues[source].displayName}: ${issues[source].count} incidents`);
        }
      });
      
      if (isCritical) {
        this.criticalZones.push({
          zone,
          ...zoneInfo,
          criticalReasons
        });
      }
    });
    
    // Sort by risk score (highest first)
    this.criticalZones.sort((a, b) => b.riskScore - a.riskScore);
  }

  // Generate actionable recommendations
  generateRecommendations() {
    this.recommendations = [];
    
    this.criticalZones.forEach(zoneInfo => {
      const recommendations = [];
      const issues = zoneInfo.issues;
      
      // Vehicle breakdown recommendations
      if (issues.vehicleBreakdown && issues.vehicleBreakdown.count >= 3) {
        recommendations.push({
          type: 'MAINTENANCE',
          priority: 'HIGH',
          action: 'Increase preventive maintenance frequency',
          reason: `${issues.vehicleBreakdown.count} vehicle breakdowns detected`
        });
      }
      
      // Late arrival recommendations
      if (issues.issuesPost0710 && issues.issuesPost0710.count >= 5) {
        recommendations.push({
          type: 'SCHEDULING',
          priority: 'HIGH',
          action: 'Review driver schedules and route timing',
          reason: `${issues.issuesPost0710.count} late arrivals after 7:10 AM`
        });
      }
      
      // Early departure recommendations
      if (issues.post06AMOpenIssues && issues.post06AMOpenIssues.count >= 8) {
        recommendations.push({
          type: 'OPERATIONS',
          priority: 'MEDIUM',
          action: 'Monitor early departure patterns and adjust schedules',
          reason: `${issues.post06AMOpenIssues.count} early departures before 6:00 AM`
        });
      }
      
      // Fuel efficiency recommendations
      if (issues.fuelStation && issues.fuelStation.count >= 10) {
        recommendations.push({
          type: 'EFFICIENCY',
          priority: 'MEDIUM',
          action: 'Optimize routes to reduce fuel station visits',
          reason: `${issues.fuelStation.count} fuel station visits on route`
        });
      }
      
      // Utilization recommendations
      if (issues.lessThan3Trips && issues.lessThan3Trips.count >= 15) {
        recommendations.push({
          type: 'UTILIZATION',
          priority: 'MEDIUM',
          action: 'Increase vehicle utilization or redistribute fleet',
          reason: `${issues.lessThan3Trips.count} vehicles with low trip counts`
        });
      }
      
      zoneInfo.recommendations = recommendations;
      this.recommendations.push(...recommendations.map(rec => ({
        zone: zoneInfo.zone,
        ...rec
      })));
    });
  }

  // Get comprehensive analysis results
  getAnalysisResults() {
    const allZones = Array.from(this.zoneData.values())
      .sort((a, b) => b.riskScore - a.riskScore);
    
    return {
      summary: {
        totalZones: this.zoneData.size,
        criticalZones: this.criticalZones.length,
        highRiskZones: allZones.filter(z => z.priority === 'HIGH').length,
        mediumRiskZones: allZones.filter(z => z.priority === 'MEDIUM').length,
        lowRiskZones: allZones.filter(z => z.priority === 'LOW').length,
        totalRecommendations: this.recommendations.length,
        lastAnalysis: this.lastAnalysis
      },
      criticalZones: this.criticalZones,
      allZones,
      recommendations: this.recommendations,
      riskDistribution: this.getRiskDistribution()
    };
  }

  // Get risk distribution for visualization
  getRiskDistribution() {
    const distribution = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0
    };
    
    this.zoneData.forEach(zoneInfo => {
      distribution[zoneInfo.priority]++;
    });
    
    return distribution;
  }

  // Get zone details for drill-down
  getZoneDetails(zoneNumber) {
    return this.zoneData.get(String(zoneNumber));
  }

  // Check if analysis needs refresh (older than 5 minutes)
  needsRefresh() {
    if (!this.lastAnalysis) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastAnalysis < fiveMinutesAgo;
  }
}

// Export singleton instance
export const zoneAnalytics = new ZoneAnalyticsService();
export default ZoneAnalyticsService;
