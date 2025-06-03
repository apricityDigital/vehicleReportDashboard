# Admin Dashboard Features

## Overview

The IMC ICCC Dashboard now includes a comprehensive admin dashboard with advanced user management, system administration, analytics, and data management capabilities. This document outlines all the admin features and how to use them.

## Access Requirements

- **Role**: Admin users only
- **Authentication**: Must be logged in with an approved admin account
- **Permissions**: Full system access with audit trail

## Admin Dashboard Components

### 1. User Management

#### Features:
- **Complete User Overview**: View all users (pending, approved, rejected, suspended)
- **Advanced Filtering**: Filter by status, role, department, or search by name/email
- **Bulk Operations**: Approve or reject multiple users simultaneously
- **Individual User Actions**:
  - Approve pending users
  - Reject registration requests
  - Suspend active users
  - Reactivate suspended users
  - Update user roles (Admin, Operator, Viewer)
- **User Detail Modal**: Comprehensive user information with edit capabilities
- **Real-time Statistics**: Live counts of users by status

#### User Roles:
- **Admin**: Full system access, user management, configuration
- **Operator**: Dashboard access with data interaction capabilities
- **Viewer**: Read-only dashboard access

#### User Statuses:
- **Pending**: Awaiting admin approval
- **Approved**: Active users with system access
- **Rejected**: Denied access
- **Suspended**: Temporarily disabled accounts

### 2. Analytics & Monitoring

#### User Analytics:
- **User Growth Tracking**: Registration trends over time
- **Role Distribution**: Visual breakdown of user roles
- **Status Distribution**: Current user status overview
- **Department Analysis**: User distribution by department
- **Recent Activity**: Latest user registrations and activities

#### Time Range Options:
- Last 7 days
- Last 30 days
- Last 90 days
- Last year

#### Key Metrics:
- Total users
- Pending approvals
- Active users
- Suspended accounts

### 3. Data Management

#### Export Capabilities:
- **JSON Export**: Complete user data with metadata
- **CSV Export**: Spreadsheet-compatible format
- **Backup Creation**: Full system backup with timestamp

#### Data Source Configuration:
- **Google Sheets Integration**: Configure data source URLs
- **Refresh Settings**: Auto-refresh intervals (1min to 1hour)
- **Connection Monitoring**: Real-time data source status

#### Backup Management:
- **Manual Backups**: On-demand system backups
- **Automatic Backups**: Scheduled daily backups
- **Backup History**: Track backup creation and status

#### System Health Monitoring:
- **Database Status**: Firebase connection monitoring
- **Authentication Status**: Auth service health
- **Data Sync Status**: Real-time sync monitoring

### 4. System Settings

#### Application Configuration:
- **App Branding**: Customize application name and description
- **Theme Selection**: Choose from multiple color themes
  - Blue (Default)
  - Green
  - Purple
  - Red
  - Indigo

#### Security Settings:
- **Login Attempts**: Configure maximum failed login attempts
- **Session Timeout**: Set automatic logout timeouts
- **Audit Logging**: Enable/disable system audit trails

#### System Features:
- **Notifications**: Enable/disable system notifications
- **Maintenance Mode**: Temporarily disable user access
- **Auto-refresh**: Configure automatic data refresh

#### Firebase Integration:
- **Connection Status**: Real-time Firebase health monitoring
- **Configuration Validation**: Verify Firebase setup
- **Service Status**: Auth and Firestore connection status

## Security Features

### Access Control:
- **Role-based Access**: Admin-only dashboard access
- **Action Logging**: All admin actions are logged
- **Session Management**: Secure session handling
- **Permission Validation**: Real-time permission checks

### Data Protection:
- **Encrypted Storage**: All data encrypted in transit and at rest
- **Backup Security**: Secure backup creation and storage
- **Audit Trail**: Complete action history for compliance

## Mobile Responsiveness

The admin dashboard is fully responsive and optimized for:
- **Desktop**: Full feature access with optimal layout
- **Tablet**: Touch-friendly interface with adapted layouts
- **Mobile**: Essential features with mobile-first design
- **Touch Devices**: Optimized touch targets and gestures

## Usage Instructions

### Accessing Admin Dashboard:
1. Log in with an admin account
2. Click the "Admin Dashboard" button in the header
3. Navigate between tabs: Users, Analytics, Data, Settings

### Managing Users:
1. Go to "User Management" tab
2. Use filters to find specific users
3. Select users for bulk actions or click individual actions
4. Click "Edit" for detailed user management

### Viewing Analytics:
1. Go to "Analytics" tab
2. Select desired time range
3. Review user statistics and trends
4. Monitor system usage patterns

### Managing Data:
1. Go to "Data Management" tab
2. Configure Google Sheets integration
3. Export data in JSON or CSV format
4. Create manual backups or enable auto-backup

### Configuring System:
1. Go to "System Settings" tab
2. Update application settings
3. Configure security parameters
4. Monitor Firebase status
5. Save changes to apply immediately

## Best Practices

### User Management:
- Regularly review pending user requests
- Use bulk actions for efficiency
- Monitor user activity and status
- Maintain proper role assignments

### System Maintenance:
- Create regular backups
- Monitor system health
- Review analytics for trends
- Update configurations as needed

### Security:
- Enable audit logging
- Set appropriate session timeouts
- Monitor failed login attempts
- Regular security reviews

## Troubleshooting

### Common Issues:
1. **Users not loading**: Check Firebase connection and security rules
2. **Export failures**: Verify user permissions and browser settings
3. **Configuration not saving**: Check admin permissions and network connectivity
4. **Analytics not updating**: Verify data refresh settings and permissions

### Support:
- Check Firebase console for errors
- Review browser console for client-side issues
- Verify Firestore security rules
- Contact system administrator for assistance

## Future Enhancements

### Planned Features:
- Advanced reporting and dashboards
- Email notifications for admin actions
- Automated user provisioning
- Integration with external systems
- Enhanced audit logging and compliance features

---

For technical support or feature requests, please contact the system administrator.
