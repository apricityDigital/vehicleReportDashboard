// Notification Service for Zone Alerts
import { zoneAnalytics } from './zoneAnalyticsService.js';

// Notification types and priorities
const NOTIFICATION_TYPES = {
  CRITICAL_ZONE: 'CRITICAL_ZONE',
  HIGH_RISK_ZONE: 'HIGH_RISK_ZONE',
  MAINTENANCE_ALERT: 'MAINTENANCE_ALERT',
  SYSTEM_ALERT: 'SYSTEM_ALERT'
};

const NOTIFICATION_PRIORITIES = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

// Notification thresholds
const ALERT_THRESHOLDS = {
  // Overall statistics thresholds (all dates)
  OVERALL: {
    CRITICAL_ZONES_COUNT: 3,        // Alert if 3+ zones are critical
    HIGH_RISK_SCORE: 100,          // Alert if any zone has risk score > 100
    BREAKDOWN_COUNT: 10,           // Alert if any zone has 10+ breakdowns
    MULTIPLE_ISSUES: 5             // Alert if zone has 5+ different issue types
  },

  // Day-wise thresholds (single day analysis)
  DAY_WISE: {
    CRITICAL_ZONES_COUNT: 2,        // Alert if 2+ zones are critical today
    HIGH_RISK_SCORE: 25,           // Alert if any zone has risk score > 25 today
    BREAKDOWN_COUNT: 3,            // Alert if any zone has 3+ breakdowns today
    MULTIPLE_ISSUES: 3             // Alert if zone has 3+ different issue types today
  },

  // Date range thresholds (custom range analysis)
  DATE_RANGE: {
    CRITICAL_ZONES_COUNT: 2,        // Alert if 2+ zones are critical in range
    HIGH_RISK_SCORE: 50,           // Alert if any zone has risk score > 50 in range
    BREAKDOWN_COUNT: 5,            // Alert if any zone has 5+ breakdowns in range
    MULTIPLE_ISSUES: 4             // Alert if zone has 4+ different issue types in range
  }
};

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
    this.lastCheck = null;
    this.isEnabled = true;
    this.soundEnabled = true;
  }

  // Add notification listener
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove notification listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.notifications);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Check for zone alerts with date filtering
  async checkZoneAlerts(dateFilter = null, alertMode = 'overall') {
    if (!this.isEnabled) return;

    try {
      const filterInfo = this.getFilterDescription(dateFilter, alertMode);
      console.log(`🔔 Checking for zone alerts: ${filterInfo}`);

      // Get fresh analytics data with date filtering
      const analysisData = await zoneAnalytics.performZoneAnalysis(dateFilter);
      const { summary, criticalZones, allZones } = analysisData;

      // Clear existing notifications
      this.clearNotifications();

      // Get appropriate thresholds based on alert mode
      const thresholds = this.getThresholdsForMode(alertMode);

      // Check for critical zones alert
      if (summary.criticalZones >= thresholds.CRITICAL_ZONES_COUNT) {
        this.addNotification({
          id: `critical-zones-${Date.now()}`,
          type: NOTIFICATION_TYPES.CRITICAL_ZONE,
          priority: NOTIFICATION_PRIORITIES.CRITICAL,
          title: `🚨 ${summary.criticalZones} Critical Zones Detected`,
          message: `${summary.criticalZones} zones require immediate attention. Click to view details.`,
          zones: criticalZones.slice(0, 5).map(z => z.zone),
          timestamp: new Date(),
          autoHide: false,
          actionRequired: true
        });
      }

      // Check individual zones for high-risk alerts
      allZones.forEach(zone => {
        // High risk score alert
        if (zone.riskScore >= thresholds.HIGH_RISK_SCORE) {
          this.addNotification({
            id: `high-risk-${zone.zone}-${Date.now()}`,
            type: NOTIFICATION_TYPES.HIGH_RISK_ZONE,
            priority: zone.priority === 'CRITICAL' ? NOTIFICATION_PRIORITIES.CRITICAL : NOTIFICATION_PRIORITIES.HIGH,
            title: `⚠️ Zone ${zone.zone} High Risk Alert`,
            message: `Risk Score: ${zone.riskScore} | ${zone.totalIssues} total issues detected`,
            zones: [zone.zone],
            timestamp: new Date(),
            autoHide: true,
            hideAfter: 10000, // 10 seconds
            details: {
              riskScore: zone.riskScore,
              totalIssues: zone.totalIssues,
              priority: zone.priority,
              topIssues: Object.entries(zone.issues)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 3)
                .map(([key, issue]) => `${issue.displayName}: ${issue.count}`)
            }
          });
        }

        // Breakdown alert
        const breakdownIssues = zone.issues.vehicleBreakdown || zone.issues.vehicleNumbers;
        if (breakdownIssues && breakdownIssues.count >= thresholds.BREAKDOWN_COUNT) {
          this.addNotification({
            id: `breakdown-${zone.zone}-${Date.now()}`,
            type: NOTIFICATION_TYPES.MAINTENANCE_ALERT,
            priority: NOTIFICATION_PRIORITIES.HIGH,
            title: `🔧 Zone ${zone.zone} Maintenance Alert`,
            message: `${breakdownIssues.count} vehicle breakdowns detected. Immediate maintenance required.`,
            zones: [zone.zone],
            timestamp: new Date(),
            autoHide: true,
            hideAfter: 15000, // 15 seconds
            actionRequired: true
          });
        }

        // Multiple issues alert
        const issueCount = Object.keys(zone.issues).length;
        if (issueCount >= thresholds.MULTIPLE_ISSUES) {
          this.addNotification({
            id: `multiple-issues-${zone.zone}-${Date.now()}`,
            type: NOTIFICATION_TYPES.SYSTEM_ALERT,
            priority: NOTIFICATION_PRIORITIES.MEDIUM,
            title: `📊 Zone ${zone.zone} Multiple Issues`,
            message: `${issueCount} different issue types detected. Comprehensive review needed.`,
            zones: [zone.zone],
            timestamp: new Date(),
            autoHide: true,
            hideAfter: 8000, // 8 seconds
            details: {
              issueTypes: Object.values(zone.issues).map(issue => issue.displayName)
            }
          });
        }
      });

      // System-wide alerts
      if (summary.totalZones > 0) {
        const criticalPercentage = (summary.criticalZones / summary.totalZones) * 100;
        if (criticalPercentage >= 50) {
          this.addNotification({
            id: `system-wide-${Date.now()}`,
            type: NOTIFICATION_TYPES.SYSTEM_ALERT,
            priority: NOTIFICATION_PRIORITIES.CRITICAL,
            title: `🚨 System-Wide Alert`,
            message: `${criticalPercentage.toFixed(1)}% of zones are in critical condition. Immediate action required.`,
            zones: [],
            timestamp: new Date(),
            autoHide: false,
            actionRequired: true,
            systemWide: true
          });
        }
      }

      this.lastCheck = new Date();
      
      // Notify listeners if we have notifications
      if (this.notifications.length > 0) {
        console.log(`🔔 Generated ${this.notifications.length} notifications`);
        this.notifyListeners();
        
        // Play sound for critical notifications
        if (this.soundEnabled && this.hasCriticalNotifications()) {
          this.playNotificationSound();
        }
      }

      return this.notifications;

    } catch (error) {
      console.error('Error checking zone alerts:', error);
      
      // Add error notification
      this.addNotification({
        id: `error-${Date.now()}`,
        type: NOTIFICATION_TYPES.SYSTEM_ALERT,
        priority: NOTIFICATION_PRIORITIES.HIGH,
        title: '❌ Alert System Error',
        message: 'Unable to check zone status. Please refresh the page.',
        zones: [],
        timestamp: new Date(),
        autoHide: true,
        hideAfter: 5000
      });
      
      this.notifyListeners();
      return this.notifications;
    }
  }

  // Add notification
  addNotification(notification) {
    // Prevent duplicate notifications
    const existingIndex = this.notifications.findIndex(n => 
      n.type === notification.type && 
      n.zones.join(',') === notification.zones.join(',')
    );

    if (existingIndex !== -1) {
      // Update existing notification
      this.notifications[existingIndex] = { ...notification };
    } else {
      // Add new notification
      this.notifications.push(notification);
    }

    // Auto-hide notifications if specified
    if (notification.autoHide && notification.hideAfter) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.hideAfter);
    }
  }

  // Remove notification
  removeNotification(notificationId) {
    const initialLength = this.notifications.length;
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    
    if (this.notifications.length !== initialLength) {
      this.notifyListeners();
    }
  }

  // Clear all notifications
  clearNotifications() {
    if (this.notifications.length > 0) {
      this.notifications = [];
      this.notifyListeners();
    }
  }

  // Check if there are critical notifications
  hasCriticalNotifications() {
    return this.notifications.some(n => n.priority === NOTIFICATION_PRIORITIES.CRITICAL);
  }

  // Get notifications by priority
  getNotificationsByPriority(priority) {
    return this.notifications.filter(n => n.priority === priority);
  }

  // Get active notifications
  getActiveNotifications() {
    return [...this.notifications];
  }

  // Play notification sound
  playNotificationSound() {
    if (!this.soundEnabled) return;

    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Critical alert sound (urgent beeps)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Enable/disable notifications
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearNotifications();
    }
  }

  // Enable/disable sound
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  // Get appropriate thresholds based on alert mode
  getThresholdsForMode(alertMode) {
    if (alertMode.includes('day-wise')) {
      return ALERT_THRESHOLDS.DAY_WISE;
    } else if (alertMode.includes('date-range')) {
      return ALERT_THRESHOLDS.DATE_RANGE;
    } else {
      return ALERT_THRESHOLDS.OVERALL;
    }
  }

  // Get notification settings
  getSettings() {
    return {
      enabled: this.isEnabled,
      soundEnabled: this.soundEnabled,
      lastCheck: this.lastCheck,
      thresholds: ALERT_THRESHOLDS
    };
  }

  // Manual refresh check
  async refreshAlerts() {
    return await this.checkZoneAlerts();
  }

  // Check day-wise alerts for specific date
  async checkDayWiseAlerts(targetDate = null) {
    const dateToCheck = targetDate || new Date().toISOString().split('T')[0];
    return await this.checkZoneAlerts({ quickDate: dateToCheck }, 'day-wise');
  }

  // Check date range alerts
  async checkDateRangeAlerts(fromDate, toDate) {
    const dateRange = { from: fromDate, to: toDate };
    return await this.checkZoneAlerts({ dateRange }, 'date-range');
  }

  // Check alerts based on current dashboard filters
  async checkFilteredAlerts(dashboardFilters) {
    const { dateRange, quickDate, selectedZone } = dashboardFilters;

    let alertMode = 'overall';
    let dateFilter = null;

    // Determine alert mode and filter based on dashboard state
    if (quickDate && quickDate !== '') {
      alertMode = 'day-wise';
      dateFilter = { quickDate };
    } else if (dateRange && (dateRange.from || dateRange.to)) {
      alertMode = 'date-range';
      dateFilter = { dateRange };
    }

    // Add zone filter if specified
    if (selectedZone && selectedZone !== '') {
      if (!dateFilter) dateFilter = {};
      dateFilter.selectedZone = selectedZone;
      alertMode += '-zone-filtered';
    }

    return await this.checkZoneAlerts(dateFilter, alertMode);
  }

  // Get human-readable description of current filter
  getFilterDescription(dateFilter, alertMode) {
    if (!dateFilter) {
      return 'Overall statistics (all dates, all zones)';
    }

    let description = '';

    if (dateFilter.quickDate) {
      description = `Day-wise analysis for ${dateFilter.quickDate}`;
    } else if (dateFilter.dateRange) {
      const { from, to } = dateFilter.dateRange;
      if (from && to) {
        description = `Date range analysis from ${from} to ${to}`;
      } else if (from) {
        description = `Analysis from ${from} onwards`;
      } else if (to) {
        description = `Analysis up to ${to}`;
      }
    } else {
      description = 'Overall statistics';
    }

    if (dateFilter.selectedZone) {
      description += ` (Zone ${dateFilter.selectedZone} only)`;
    }

    return description;
  }

  // Auto-trigger alerts based on dashboard context
  async autoTriggerContextualAlerts(dashboardState) {
    try {
      console.log('🎯 Auto-triggering contextual alerts based on dashboard filters...');

      const notifications = await this.checkFilteredAlerts(dashboardState);

      if (notifications.length > 0) {
        console.log(`📊 Generated ${notifications.length} contextual notifications`);

        // Add context information to notifications
        notifications.forEach(notification => {
          notification.context = {
            filterMode: dashboardState.quickDate ? 'day-wise' :
                       (dashboardState.dateRange?.from || dashboardState.dateRange?.to) ? 'date-range' : 'overall',
            dateFilter: dashboardState.quickDate || dashboardState.dateRange,
            zoneFilter: dashboardState.selectedZone
          };
        });

        // Play sound for critical notifications in filtered context
        if (this.soundEnabled && this.hasCriticalNotifications()) {
          this.playNotificationSound();
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error in auto-trigger contextual alerts:', error);
      return [];
    }
  }

  // Demo function to simulate critical alerts (for testing)
  generateDemoAlerts() {
    this.clearNotifications();

    // Simulate critical zone alert
    this.addNotification({
      id: `demo-critical-${Date.now()}`,
      type: NOTIFICATION_TYPES.CRITICAL_ZONE,
      priority: NOTIFICATION_PRIORITIES.CRITICAL,
      title: '🚨 3 Critical Zones Detected',
      message: 'Zones 13, 1, and 4 require immediate attention. Multiple vehicle breakdowns and operational issues detected.',
      zones: ['13', '1', '4'],
      timestamp: new Date(),
      autoHide: false,
      actionRequired: true,
      details: {
        totalIssues: 45,
        criticalZones: 3
      }
    });

    // Simulate high-risk zone alert
    this.addNotification({
      id: `demo-high-risk-${Date.now()}`,
      type: NOTIFICATION_TYPES.HIGH_RISK_ZONE,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      title: '⚠️ Zone 13 High Risk Alert',
      message: 'Risk Score: 87.5 | 15 total issues detected',
      zones: ['13'],
      timestamp: new Date(),
      autoHide: true,
      hideAfter: 15000,
      details: {
        riskScore: 87.5,
        totalIssues: 15,
        priority: 'HIGH',
        topIssues: ['Vehicle Breakdowns: 7', 'Late Arrivals: 5', 'Driver Issues: 3']
      }
    });

    // Simulate maintenance alert
    this.addNotification({
      id: `demo-maintenance-${Date.now()}`,
      type: NOTIFICATION_TYPES.MAINTENANCE_ALERT,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      title: '🔧 Zone 1 Maintenance Alert',
      message: '5 vehicle breakdowns detected. Immediate maintenance required.',
      zones: ['1'],
      timestamp: new Date(),
      autoHide: true,
      hideAfter: 12000,
      actionRequired: true
    });

    // Simulate system alert
    this.addNotification({
      id: `demo-system-${Date.now()}`,
      type: NOTIFICATION_TYPES.SYSTEM_ALERT,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      title: '📊 Zone 4 Multiple Issues',
      message: '6 different issue types detected. Comprehensive review needed.',
      zones: ['4'],
      timestamp: new Date(),
      autoHide: true,
      hideAfter: 10000,
      details: {
        issueTypes: ['Vehicle Breakdowns', 'Late Arrivals', 'Fuel Issues', 'Driver Problems', 'Helper Issues', 'Workshop Delays']
      }
    });

    this.notifyListeners();

    if (this.soundEnabled) {
      this.playNotificationSound();
    }

    return this.notifications;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export { NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES };
export default NotificationService;
