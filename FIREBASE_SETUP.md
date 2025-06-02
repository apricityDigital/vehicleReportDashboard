# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication with admin approval for the IMC ICCC Vehicle Management System.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `imc-iccc-vehicle-system`
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password** authentication
5. Click **Save**

## 3. Create Firestore Database

1. Go to **Firestore Database** in the left sidebar
2. Click **Create database**
3. Choose **Start in test mode** (we'll secure it later)
4. Select a location close to your users
5. Click **Done**

## 4. Set up Firestore Security Rules

Go to **Firestore Database** > **Rules** and replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // Admins can read all user documents
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      // Admins can update user status (approve/reject)
      allow update: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
        // Only allow updating specific fields
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'approvedBy', 'approvedAt', 'rejectedBy', 'rejectedAt', 'updatedAt']);
    }
  }
}
```

## 5. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click **Web app** icon (`</>`)
4. Register your app with name: `IMC ICCC Dashboard`
5. Copy the Firebase configuration object

## 6. Update Firebase Configuration

Replace the configuration in `src/config/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 7. Create First Admin User

Since the system requires admin approval, you need to create the first admin manually:

### Option A: Using Firebase Console
1. Go to **Firestore Database**
2. Click **Start collection**
3. Collection ID: `users`
4. Document ID: (auto-generate)
5. Add fields:
   ```
   uid: "your-auth-uid" (you'll get this after creating the user)
   email: "admin@imc.gov"
   name: "System Administrator"
   role: "admin"
   status: "approved"
   department: "IT Department"
   createdAt: (current timestamp)
   updatedAt: (current timestamp)
   ```

### Option B: Create via Authentication first
1. Go to **Authentication** > **Users**
2. Click **Add user**
3. Email: `admin@imc.gov`
4. Password: (set a secure password)
5. Copy the UID
6. Go to **Firestore Database** and create the user document with the UID

## 8. User Roles and Permissions

The system supports three user roles:

- **admin**: Can approve/reject users, full system access
- **operator**: Limited system access, can view and interact with data
- **viewer**: Read-only access to dashboard

## 9. User Registration Flow

1. New users register via the signup form
2. Account is created with `status: "pending"`
3. User is immediately signed out
4. Admin receives notification (you can implement email notifications)
5. Admin logs in and sees pending requests in Admin Panel
6. Admin approves or rejects the request
7. Approved users can then log in and access the system

## 10. Testing the System

1. Start your development server: `npm run dev`
2. Try to access the dashboard (should show login page)
3. Click "Request Access" to test signup
4. Log in as admin to approve the request
5. Log in as the new user to test access

## 11. Production Considerations

### Security Rules
Update Firestore rules for production to be more restrictive.

### Email Notifications
Consider implementing email notifications for:
- New user registration (to admins)
- Account approval/rejection (to users)

### Backup Strategy
Set up regular Firestore backups for user data.

### Monitoring
Enable Firebase Analytics and Performance Monitoring.

## 12. Environment Variables (Optional)

For better security, you can use environment variables:

Create `.env.local`:
```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Then update `firebase.js` to use these variables.

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify Firebase configuration
3. Check Firestore security rules
4. Ensure the first admin user is properly created

The authentication system is now ready for production use with admin approval workflow!
