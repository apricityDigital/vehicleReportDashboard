import React, { useState, useEffect } from 'react';
import { notificationService, NOTIFICATION_PRIORITIES } from '../services/notificationService.js';
import './NotificationPopup.css';

const NotificationPopup = ({ onZoneClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [settings, setSettings] = useState({
    enabled: true,
    soundEnabled: true
  });

  // Subscribe to notifications
  useEffect(() => {
    const handleNotifications = (newNotifications) => {
      setNotifications(newNotifications);
      setIsVisible(newNotifications.length > 0);
    };

    notificationService.addListener(handleNotifications);
    
    // Get initial settings
    setSettings(notificationService.getSettings());

    return () => {
      notificationService.removeListener(handleNotifications);
    };
  }, []);

  // Auto-minimize after 30 seconds if not critical
  useEffect(() => {
    if (isVisible && !isMinimized && !hasCriticalNotifications()) {
      const timer = setTimeout(() => {
        setIsMinimized(true);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, isMinimized, notifications]);

  // Check for critical notifications
  const hasCriticalNotifications = () => {
    return notifications.some(n => n.priority === NOTIFICATION_PRIORITIES.CRITICAL);
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case NOTIFICATION_PRIORITIES.CRITICAL: return '🚨';
      case NOTIFICATION_PRIORITIES.HIGH: return '⚠️';
      case NOTIFICATION_PRIORITIES.MEDIUM: return '⚡';
      case NOTIFICATION_PRIORITIES.LOW: return 'ℹ️';
      default: return '📢';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case NOTIFICATION_PRIORITIES.CRITICAL: return '#dc2626';
      case NOTIFICATION_PRIORITIES.HIGH: return '#ea580c';
      case NOTIFICATION_PRIORITIES.MEDIUM: return '#d97706';
      case NOTIFICATION_PRIORITIES.LOW: return '#2563eb';
      default: return '#6b7280';
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification.zones.length === 1 && onZoneClick) {
      onZoneClick(notification.zones[0]);
    }
  };

  // Handle dismiss notification
  const handleDismiss = (notificationId, event) => {
    event.stopPropagation();
    notificationService.removeNotification(notificationId);
  };

  // Handle dismiss all
  const handleDismissAll = () => {
    notificationService.clearNotifications();
    setIsVisible(false);
  };

  // Handle minimize/maximize
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Handle close
  const handleClose = () => {
    setIsVisible(false);
    notificationService.clearNotifications();
  };

  // Toggle sound
  const handleToggleSound = () => {
    const newSoundEnabled = !settings.soundEnabled;
    notificationService.setSoundEnabled(newSoundEnabled);
    setSettings(prev => ({ ...prev, soundEnabled: newSoundEnabled }));
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  // Get filter context display
  const getFilterContextDisplay = (context) => {
    if (!context) return null;

    const { filterMode, dateFilter, zoneFilter } = context;

    let contextText = '';

    switch (filterMode) {
      case 'day-wise':
        contextText = `📅 ${dateFilter || 'Today'}`;
        break;
      case 'date-range':
        if (dateFilter?.from && dateFilter?.to) {
          contextText = `📊 ${dateFilter.from} to ${dateFilter.to}`;
        } else if (dateFilter?.from) {
          contextText = `📊 From ${dateFilter.from}`;
        } else if (dateFilter?.to) {
          contextText = `📊 Until ${dateFilter.to}`;
        }
        break;
      case 'overall':
      default:
        contextText = '📈 All Dates';
        break;
    }

    if (zoneFilter) {
      contextText += ` • Zone ${zoneFilter}`;
    }

    return contextText;
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  const criticalCount = notifications.filter(n => n.priority === NOTIFICATION_PRIORITIES.CRITICAL).length;
  const highCount = notifications.filter(n => n.priority === NOTIFICATION_PRIORITIES.HIGH).length;

  return (
    <div className={`notification-popup ${isMinimized ? 'minimized' : ''}`}>
      {/* Header */}
      <div className="notification-header">
        <div className="header-left">
          <div className="notification-icon">
            {hasCriticalNotifications() ? '🚨' : '🔔'}
          </div>
          <div className="header-info">
            <h3>Zone Alerts</h3>
            <div className="alert-summary">
              {criticalCount > 0 && <span className="critical-badge">{criticalCount} Critical</span>}
              {highCount > 0 && <span className="high-badge">{highCount} High</span>}
              <span className="total-count">{notifications.length} total</span>
            </div>
            {/* Show filter context if available */}
            {notifications.length > 0 && notifications[0].context && (
              <div className="filter-context">
                {getFilterContextDisplay(notifications[0].context)}
              </div>
            )}
          </div>
        </div>
        
        <div className="header-controls">
          {/* Sound toggle */}
          <button
            onClick={handleToggleSound}
            className={`control-btn sound-btn ${settings.soundEnabled ? 'enabled' : 'disabled'}`}
            title={settings.soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            {settings.soundEnabled ? '🔊' : '🔇'}
          </button>
          
          {/* Minimize/Maximize */}
          <button
            onClick={handleToggleMinimize}
            className="control-btn minimize-btn"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          
          {/* Close */}
          <button
            onClick={handleClose}
            className="control-btn close-btn"
            title="Close all notifications"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {!isMinimized && (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item priority-${notification.priority.toLowerCase()}`}
              onClick={() => handleNotificationClick(notification)}
              style={{ borderLeftColor: getPriorityColor(notification.priority) }}
            >
              <div className="notification-content">
                <div className="notification-main">
                  <div className="notification-title">
                    <span className="priority-icon">
                      {getPriorityIcon(notification.priority)}
                    </span>
                    {notification.title}
                  </div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  
                  {/* Zone badges */}
                  {notification.zones.length > 0 && (
                    <div className="zone-badges">
                      {notification.zones.map(zone => (
                        <span key={zone} className="zone-badge">
                          Zone {zone}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Additional details */}
                  {notification.details && (
                    <div className="notification-details">
                      {notification.details.riskScore && (
                        <span className="detail-item">
                          Risk: {notification.details.riskScore}
                        </span>
                      )}
                      {notification.details.totalIssues && (
                        <span className="detail-item">
                          Issues: {notification.details.totalIssues}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="notification-meta">
                  <div className="notification-time">
                    {formatTimeAgo(notification.timestamp)}
                  </div>
                  {notification.actionRequired && (
                    <div className="action-required">
                      Action Required
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dismiss button */}
              <button
                onClick={(e) => handleDismiss(notification.id, e)}
                className="dismiss-btn"
                title="Dismiss notification"
              >
                ✕
              </button>
            </div>
          ))}
          
          {/* Footer actions */}
          {notifications.length > 1 && (
            <div className="notifications-footer">
              <button onClick={handleDismissAll} className="dismiss-all-btn">
                Dismiss All ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Minimized indicator */}
      {isMinimized && (
        <div className="minimized-indicator">
          <div className="pulse-dot"></div>
          <span>{notifications.length} active alerts</span>
          {hasCriticalNotifications() && (
            <span className="critical-indicator">CRITICAL</span>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPopup;
