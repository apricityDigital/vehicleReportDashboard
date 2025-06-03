# Admin Approval Workflow Troubleshooting Guide

## Overview
This guide helps diagnose and fix issues with the admin approval workflow where pending user registration requests are not appearing in the admin interface.

## Common Issues and Solutions

### 1. Firestore Security Rules Issues

**Problem**: Admin cannot read pending users due to restrictive security rules.

**Solution**: Update Firestore security rules to allow admins to read all user documents.

1. Go to Firebase Console → Firestore Database → Rules
2. Replace the rules with the content from `firestore.rules` file
3. Publish the rules

**Test**: Use the "Test Connection" button in the Admin Panel (development mode)

### 2. Missing Composite Index

**Problem**: Query with `where` + `orderBy` requires a composite index in Firestore.

**Symptoms**: 
- Error: "The query requires an index"
- Console shows index-related errors

**Solution**: 
1. The app now automatically falls back to a simple query without `orderBy`
2. To create the index manually:
   - Go to Firebase Console → Firestore Database → Indexes
   - Create composite index for collection `users` with fields:
     - `status` (Ascending)
     - `createdAt` (Descending)

### 3. No Admin User Exists

**Problem**: No admin user exists to approve pending requests.

**Solution**: Create the first admin user manually:

#### Option A: Using Firebase Console
1. Go to Authentication → Users → Add user
2. Create user with admin email/password
3. Go to Firestore Database → users collection
4. Create document with the user's UID:
```json
{
  "uid": "user-uid-from-auth",
  "email": "admin@example.com",
  "name": "System Administrator",
  "role": "admin",
  "status": "approved",
  "department": "IT Department",
  "createdAt": "current-timestamp",
  "updatedAt": "current-timestamp"
}
```

#### Option B: Using Setup Script
```javascript
import { createFirstAdmin } from './src/utils/firebaseSetup.js';

await createFirstAdmin({
  email: 'admin@example.com',
  password: 'secure-password',
  name: 'System Administrator',
  department: 'IT Department'
});
```

### 4. Firebase Configuration Issues

**Problem**: Firebase not properly configured or initialized.

**Symptoms**:
- "Firebase app not initialized" errors
- Connection timeouts
- Authentication failures

**Solution**:
1. Verify `src/config/firebase.js` has correct configuration
2. Check that all required Firebase services are enabled:
   - Authentication (Email/Password)
   - Firestore Database
3. Verify API keys and project settings

### 5. Network/CORS Issues

**Problem**: Browser blocking Firebase requests due to CORS or network issues.

**Solution**:
1. Check browser console for CORS errors
2. Verify Firebase project domain settings
3. Test from different network/browser
4. Clear browser cache and cookies

## Debugging Steps

### Step 1: Check Browser Console
1. Open browser developer tools
2. Go to Console tab
3. Look for Firebase-related errors
4. Check Network tab for failed requests

### Step 2: Test Firebase Connection
1. Login as admin user
2. Open Admin Panel
3. Click "Test Connection" button (development mode)
4. Review test results in console and UI

### Step 3: Verify User Data
1. Go to Firebase Console → Firestore Database
2. Check `users` collection
3. Verify pending users exist with `status: "pending"`
4. Verify admin user exists with `role: "admin"` and `status: "approved"`

### Step 4: Check Security Rules
1. Go to Firebase Console → Firestore Database → Rules
2. Verify rules allow admin to read user documents
3. Test rules using Firebase Rules Playground

## Manual Testing Procedure

### 1. Create Test Pending User
```javascript
// In browser console (as admin)
import { signUpUser } from './src/services/authService.js';

await signUpUser({
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  department: 'Test Department',
  phone: '1234567890'
});
```

### 2. Verify Admin Can Query Pending Users
```javascript
// In browser console (as admin)
import { getPendingUsers } from './src/services/authService.js';

const pendingUsers = await getPendingUsers();
console.log('Pending users:', pendingUsers);
```

### 3. Test Admin Panel Functionality
1. Login as admin
2. Open Admin Panel
3. Verify pending users are displayed
4. Test approve/reject functionality

## Error Messages and Solutions

### "Permission denied"
- **Cause**: Firestore security rules blocking access
- **Solution**: Update security rules to allow admin access

### "The query requires an index"
- **Cause**: Missing composite index for status + createdAt
- **Solution**: App automatically falls back to simple query

### "User data not found"
- **Cause**: User document missing in Firestore
- **Solution**: Verify user registration process creates Firestore document

### "Firebase app not initialized"
- **Cause**: Firebase configuration error
- **Solution**: Check `src/config/firebase.js` configuration

## Prevention

1. **Regular Testing**: Test admin approval workflow after any Firebase changes
2. **Monitoring**: Set up Firebase monitoring and alerts
3. **Backup Admin**: Always have multiple admin users
4. **Documentation**: Keep Firebase configuration documented
5. **Security Rules**: Regularly review and test security rules

## Support

If issues persist:
1. Check Firebase Console for service status
2. Review Firebase documentation
3. Test with minimal reproduction case
4. Contact Firebase support if needed

## Development Tools

The app includes several debugging tools in development mode:
- Firebase connection test
- Debug information display
- Enhanced error logging
- Permission testing utilities

Use these tools to diagnose issues quickly during development.
