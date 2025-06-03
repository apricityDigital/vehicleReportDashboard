import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// User status constants
export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended'
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
};

// Sign up new user (requires admin approval)
export const signUpUser = async (userData) => {
  console.log('Starting user signup process...', { email: userData.email, name: userData.name });

  try {
    const { email, password, name, department, phone, role = USER_ROLES.VIEWER } = userData;

    console.log('Step 1: Creating Firebase Auth user...');
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Firebase Auth user created:', user.uid);

    console.log('Step 2: Updating user profile...');
    // Update user profile
    await updateProfile(user, {
      displayName: name
    });
    console.log('✅ User profile updated');

    console.log('Step 3: Creating Firestore user document...');
    // Create user document in Firestore
    const userDocData = {
      uid: user.uid,
      email: email,
      name: name,
      department: department,
      phone: phone,
      role: role,
      status: USER_STATUS.PENDING,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      approvedBy: null,
      approvedAt: null
    };

    await setDoc(doc(db, 'users', user.uid), userDocData);
    console.log('✅ Firestore user document created');

    console.log('Step 4: Signing out user...');
    // Sign out the user immediately (they need approval first)
    await signOut(auth);
    console.log('✅ User signed out');

    console.log('✅ Signup process completed successfully');
    return {
      success: true,
      message: 'Account created successfully. Please wait for admin approval.',
      user: {
        uid: user.uid,
        email: email,
        name: name,
        status: USER_STATUS.PENDING
      }
    };
  } catch (error) {
    console.error('❌ Error during signup process:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });

    // Provide more specific error messages
    let userMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      userMessage = 'An account with this email already exists. Please use a different email or try signing in.';
    } else if (error.code === 'auth/weak-password') {
      userMessage = 'Password is too weak. Please use a stronger password.';
    } else if (error.code === 'auth/invalid-email') {
      userMessage = 'Invalid email address. Please check your email and try again.';
    } else if (error.code === 'auth/network-request-failed') {
      userMessage = 'Network error. Please check your internet connection and try again.';
    }

    return {
      success: false,
      message: userMessage,
      errorCode: error.code
    };
  }
};

// Sign in user (only if approved)
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check user status in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      await signOut(auth);
      return {
        success: false,
        message: 'User data not found. Please contact administrator.'
      };
    }
    
    const userData = userDoc.data();
    
    // Check if user is approved
    if (userData.status !== USER_STATUS.APPROVED) {
      await signOut(auth);
      let message = 'Account access denied.';
      
      switch (userData.status) {
        case USER_STATUS.PENDING:
          message = 'Your account is pending approval. Please wait for admin approval.';
          break;
        case USER_STATUS.REJECTED:
          message = 'Your account has been rejected. Please contact administrator.';
          break;
        case USER_STATUS.SUSPENDED:
          message = 'Your account has been suspended. Please contact administrator.';
          break;
      }
      
      return {
        success: false,
        message: message
      };
    }
    
    return {
      success: true,
      message: 'Login successful',
      user: {
        uid: user.uid,
        email: user.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        status: userData.status
      }
    };
  } catch (error) {
    console.error('Error signing in:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } catch (error) {
    console.error('Error signing out:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Get current user data
export const getCurrentUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Admin functions
export const getPendingUsers = async () => {
  try {
    console.log('Fetching pending users...');

    // First try with orderBy - this requires a composite index
    try {
      const q = query(
        collection(db, 'users'),
        where('status', '==', USER_STATUS.PENDING),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      console.log('Found pending users with orderBy:', users.length);
      return users;
    } catch (indexError) {
      console.warn('Composite index not available, falling back to simple query:', indexError);

      // Fallback: Simple query without orderBy
      const q = query(
        collection(db, 'users'),
        where('status', '==', USER_STATUS.PENDING)
      );
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      // Sort manually by createdAt
      users.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

      console.log('Found pending users with simple query:', users.length);
      return users;
    }
  } catch (error) {
    console.error('Error getting pending users:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error; // Re-throw to let the component handle it
  }
};

// Approve user
export const approveUser = async (userId, adminId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: USER_STATUS.APPROVED,
      approvedBy: adminId,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, message: 'User approved successfully' };
  } catch (error) {
    console.error('Error approving user:', error);
    return { success: false, message: error.message };
  }
};

// Reject user
export const rejectUser = async (userId, adminId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: USER_STATUS.REJECTED,
      rejectedBy: adminId,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, message: 'User rejected successfully' };
  } catch (error) {
    console.error('Error rejecting user:', error);
    return { success: false, message: error.message };
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};


