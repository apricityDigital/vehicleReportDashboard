import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { USER_STATUS, USER_ROLES } from '../services/authService';

/**
 * Setup script to create the first admin user
 * This should only be run once during initial setup
 */
export const createFirstAdmin = async (adminData) => {
  try {
    const { email, password, name, department = 'IT Department' } = adminData;
    
    console.log('Creating first admin user...');
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile
    await updateProfile(user, {
      displayName: name
    });
    
    // Create user document in Firestore with admin privileges
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      name: name,
      department: department,
      phone: '',
      role: USER_ROLES.ADMIN,
      status: USER_STATUS.APPROVED, // Admin is pre-approved
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      approvedBy: 'system',
      approvedAt: serverTimestamp(),
      isFirstAdmin: true
    });
    
    console.log('✅ First admin user created successfully');
    return {
      success: true,
      message: 'First admin user created successfully',
      user: {
        uid: user.uid,
        email: email,
        name: name,
        role: USER_ROLES.ADMIN
      }
    };
  } catch (error) {
    console.error('❌ Error creating first admin:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Check if any admin users exist in the system
 */
export const checkAdminExists = async () => {
  try {
    const q = query(collection(db, 'users'));
    const querySnapshot = await getDocs(q);
    
    let adminExists = false;
    let totalUsers = 0;
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      totalUsers++;
      if (userData.role === USER_ROLES.ADMIN && userData.status === USER_STATUS.APPROVED) {
        adminExists = true;
      }
    });
    
    return {
      adminExists,
      totalUsers,
      needsSetup: !adminExists && totalUsers === 0
    };
  } catch (error) {
    console.error('Error checking admin existence:', error);
    return {
      adminExists: false,
      totalUsers: 0,
      needsSetup: true,
      error: error.message
    };
  }
};

/**
 * Validate Firebase configuration
 */
export const validateFirebaseConfig = () => {
  const config = {
    hasAuth: !!auth,
    hasDb: !!db,
    authConfig: {
      apiKey: !!auth?.app?.options?.apiKey,
      authDomain: !!auth?.app?.options?.authDomain,
      projectId: !!auth?.app?.options?.projectId
    }
  };
  
  const isValid = config.hasAuth && config.hasDb && 
    config.authConfig.apiKey && config.authConfig.authDomain && config.authConfig.projectId;
  
  return {
    isValid,
    config,
    issues: !isValid ? [
      !config.hasAuth && 'Firebase Auth not initialized',
      !config.hasDb && 'Firestore not initialized',
      !config.authConfig.apiKey && 'Missing API key',
      !config.authConfig.authDomain && 'Missing auth domain',
      !config.authConfig.projectId && 'Missing project ID'
    ].filter(Boolean) : []
  };
};

/**
 * Test Firestore permissions for current user
 */
export const testFirestorePermissions = async (currentUser) => {
  const tests = [];
  
  try {
    // Test 1: Read own user document
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      tests.push({
        test: 'Read own user document',
        passed: userDoc.exists(),
        details: userDoc.exists() ? 'Success' : 'Document not found'
      });
    } catch (error) {
      tests.push({
        test: 'Read own user document',
        passed: false,
        details: error.message
      });
    }
    
    // Test 2: Read all users (admin only)
    try {
      const q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      tests.push({
        test: 'Read all users (admin)',
        passed: true,
        details: `Found ${querySnapshot.size} users`
      });
    } catch (error) {
      tests.push({
        test: 'Read all users (admin)',
        passed: false,
        details: error.message
      });
    }
    
    // Test 3: Query pending users
    try {
      const q = query(
        collection(db, 'users'),
        where('status', '==', USER_STATUS.PENDING)
      );
      const querySnapshot = await getDocs(q);
      tests.push({
        test: 'Query pending users',
        passed: true,
        details: `Found ${querySnapshot.size} pending users`
      });
    } catch (error) {
      tests.push({
        test: 'Query pending users',
        passed: false,
        details: error.message
      });
    }
    
  } catch (error) {
    tests.push({
      test: 'General permissions test',
      passed: false,
      details: error.message
    });
  }
  
  return {
    allPassed: tests.every(test => test.passed),
    tests
  };
};
