import React, { useState, useEffect } from 'react';
import { zoneAnalytics } from '../services/zoneAnalyticsService.js';
import './MasterDashboard.css';

const MasterDashboard = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load analysis data
  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await zoneAnalytics.performZoneAnalysis();
      setAnalysisData(results);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load zone analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh setup
  useEffect(() => {
    loadAnalysis();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        if (zoneAnalytics.needsRefresh()) {
          loadAnalysis();
        }
      }, 60000); // Check every minute
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '#dc2626'; // Red
      case 'HIGH': return '#ea580c';     // Orange
      case 'MEDIUM': return '#d97706';   // Amber
      case 'LOW': return '#16a34a';      // Green
      default: return '#6b7280';         // Gray
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '⚡';
      case 'LOW': return '✅';
      default: return '📊';
    }
  };

  // Handle zone selection for drill-down
  const handleZoneClick = (zone) => {
    const zoneDetails = zoneAnalytics.getZoneDetails(zone);
    setSelectedZone({ zone, ...zoneDetails });
  };

  if (loading) {
    return (
      <div className="master-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing zone data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="master-dashboard error">
        <div className="error-message">
          <h3>❌ Analysis Failed</h3>
          <p>{error}</p>
          <button onClick={loadAnalysis} className="retry-btn">
            🔄 Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="master-dashboard no-data">
        <p>No analysis data available</p>
      </div>
    );
  }

  const { summary, criticalZones, allZones, recommendations, riskDistribution } = analysisData;

  return (
    <div className="master-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🎯 Master Zone Analytics Dashboard</h1>
          <div className="header-controls">
            <div className="auto-refresh">
              <label>
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-refresh
              </label>
            </div>
            <button onClick={loadAnalysis} className="refresh-btn">
              🔄 Refresh Now
            </button>
          </div>
        </div>
        <div className="last-updated">
          Last updated: {summary.lastAnalysis?.toLocaleString()}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card total">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Total Zones</h3>
            <div className="card-value">{summary.totalZones}</div>
          </div>
        </div>
        
        <div className="summary-card critical">
          <div className="card-icon">🚨</div>
          <div className="card-content">
            <h3>Critical Zones</h3>
            <div className="card-value">{summary.criticalZones}</div>
          </div>
        </div>
        
        <div className="summary-card high">
          <div className="card-icon">⚠️</div>
          <div className="card-content">
            <h3>High Risk</h3>
            <div className="card-value">{summary.highRiskZones}</div>
          </div>
        </div>
        
        <div className="summary-card recommendations">
          <div className="card-icon">💡</div>
          <div className="card-content">
            <h3>Recommendations</h3>
            <div className="card-value">{summary.totalRecommendations}</div>
          </div>
        </div>
      </div>

      {/* Critical Zones Alert */}
      {criticalZones.length > 0 && (
        <div className="critical-alert">
          <div className="alert-header">
            <h2>🚨 Zones Requiring Immediate Attention</h2>
          </div>
          <div className="critical-zones-grid">
            {criticalZones.slice(0, 6).map((zone) => (
              <div
                key={zone.zone}
                className="critical-zone-card"
                onClick={() => handleZoneClick(zone.zone)}
              >
                <div className="zone-header">
                  <span className="zone-number">Zone {zone.zone}</span>
                  <span className="risk-score">{zone.riskScore}</span>
                </div>
                <div className="zone-issues">
                  <div className="total-issues">{zone.totalIssues} issues</div>
                  <div className="critical-reasons">
                    {zone.criticalReasons.slice(0, 2).map((reason, idx) => (
                      <div key={idx} className="reason">{reason}</div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Zones Overview */}
      <div className="zones-overview">
        <h2>📍 All Zones Risk Assessment</h2>
        <div className="zones-grid">
          {allZones.map((zone) => (
            <div
              key={zone.zone}
              className={`zone-card priority-${zone.priority.toLowerCase()}`}
              onClick={() => handleZoneClick(zone.zone)}
              style={{ borderLeftColor: getPriorityColor(zone.priority) }}
            >
              <div className="zone-header">
                <span className="zone-number">Zone {zone.zone}</span>
                <span className="priority-badge">
                  {getPriorityIcon(zone.priority)} {zone.priority}
                </span>
              </div>
              <div className="zone-metrics">
                <div className="metric">
                  <span className="label">Risk Score:</span>
                  <span className="value">{zone.riskScore}</span>
                </div>
                <div className="metric">
                  <span className="label">Total Issues:</span>
                  <span className="value">{zone.totalIssues}</span>
                </div>
              </div>
              <div className="zone-issues-summary">
                {Object.entries(zone.issues).slice(0, 3).map(([key, issue]) => (
                  <div key={key} className="issue-item">
                    <span className="issue-name">{issue.displayName}:</span>
                    <span className="issue-count">{issue.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations Panel */}
      {recommendations.length > 0 && (
        <div className="recommendations-panel">
          <h2>💡 Actionable Recommendations</h2>
          <div className="recommendations-grid">
            {recommendations.slice(0, 8).map((rec, idx) => (
              <div key={idx} className={`recommendation-card priority-${rec.priority.toLowerCase()}`}>
                <div className="rec-header">
                  <span className="rec-zone">Zone {rec.zone}</span>
                  <span className="rec-type">{rec.type}</span>
                </div>
                <div className="rec-action">{rec.action}</div>
                <div className="rec-reason">{rec.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone Details Modal */}
      {selectedZone && (
        <div className="zone-modal-overlay" onClick={() => setSelectedZone(null)}>
          <div className="zone-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Zone {selectedZone.zone} - Detailed Analysis</h3>
              <button onClick={() => setSelectedZone(null)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <div className="zone-summary">
                <div className="summary-item">
                  <span className="label">Risk Score:</span>
                  <span className="value">{selectedZone.riskScore}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Priority:</span>
                  <span className={`value priority-${selectedZone.priority.toLowerCase()}`}>
                    {getPriorityIcon(selectedZone.priority)} {selectedZone.priority}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="label">Total Issues:</span>
                  <span className="value">{selectedZone.totalIssues}</span>
                </div>
              </div>
              
              <div className="issues-breakdown">
                <h4>Issues Breakdown</h4>
                {Object.entries(selectedZone.issues).map(([key, issue]) => (
                  <div key={key} className="issue-detail">
                    <span className="issue-name">{issue.displayName}</span>
                    <span className="issue-count">{issue.count}</span>
                    <span className="issue-weight">Weight: {issue.weight}x</span>
                  </div>
                ))}
              </div>
              
              {selectedZone.recommendations && selectedZone.recommendations.length > 0 && (
                <div className="zone-recommendations">
                  <h4>Recommendations</h4>
                  {selectedZone.recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation-detail">
                      <div className="rec-action">{rec.action}</div>
                      <div className="rec-reason">{rec.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDashboard;
