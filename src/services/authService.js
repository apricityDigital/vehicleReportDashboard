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
  deleteDoc,
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

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Get users by status
export const getUsersByStatus = async (status) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return users;
  } catch (error) {
    console.error('Error getting users by status:', error);
    throw error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, newRole, adminId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      updatedAt: serverTimestamp(),
      roleUpdatedBy: adminId,
      roleUpdatedAt: serverTimestamp()
    });
    return { success: true, message: 'User role updated successfully' };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, message: error.message };
  }
};

// Suspend user (admin only)
export const suspendUser = async (userId, adminId, reason = '') => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: USER_STATUS.SUSPENDED,
      suspendedBy: adminId,
      suspendedAt: serverTimestamp(),
      suspensionReason: reason,
      updatedAt: serverTimestamp()
    });
    return { success: true, message: 'User suspended successfully' };
  } catch (error) {
    console.error('Error suspending user:', error);
    return { success: false, message: error.message };
  }
};

// Reactivate user (admin only)
export const reactivateUser = async (userId, adminId) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: USER_STATUS.APPROVED,
      reactivatedBy: adminId,
      reactivatedAt: serverTimestamp(),
      suspensionReason: null,
      updatedAt: serverTimestamp()
    });
    return { success: true, message: 'User reactivated successfully' };
  } catch (error) {
    console.error('Error reactivating user:', error);
    return { success: false, message: error.message };
  }
};

// Delete user (admin only) - DANGEROUS OPERATION
export const deleteUser = async (userId, adminId, reason = '') => {
  try {
    // First, get the user data for logging purposes
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { success: false, message: 'User not found' };
    }

    const userData = userDoc.data();

    // Log the deletion for audit purposes
    console.warn('🚨 USER DELETION:', {
      deletedUserId: userId,
      deletedUserEmail: userData.email,
      deletedUserName: userData.name,
      deletedBy: adminId,
      reason: reason,
      timestamp: new Date().toISOString()
    });

    // Create a deletion log entry (optional - for audit trail)
    try {
      await setDoc(doc(db, 'deletedUsers', userId), {
        ...userData,
        deletedBy: adminId,
        deletedAt: serverTimestamp(),
        deletionReason: reason,
        originalId: userId
      });
    } catch (logError) {
      console.warn('Could not create deletion log:', logError);
      // Continue with deletion even if logging fails
    }

    // Delete the user document from Firestore
    await deleteDoc(doc(db, 'users', userId));

    return {
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: userId,
        email: userData.email,
        name: userData.name
      }
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.message };
  }
};

// Bulk delete users (admin only) - EXTREMELY DANGEROUS
export const bulkDeleteUsers = async (userIds, adminId, reason = '') => {
  try {
    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const result = await deleteUser(userId, adminId, reason);
        if (result.success) {
          results.push(result.deletedUser);
        } else {
          errors.push({ userId, error: result.message });
        }
      } catch (error) {
        errors.push({ userId, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      message: `Deleted ${results.length} users${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      deletedUsers: results,
      errors: errors
    };
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    return { success: false, message: error.message };
  }
};

// Get user activity logs (placeholder for future implementation)
export const getUserActivityLogs = async (userId, limit = 50) => {
  try {
    // This would query an activity logs collection
    // For now, return empty array as placeholder
    return [];
  } catch (error) {
    console.error('Error getting user activity logs:', error);
    throw error;
  }
};

// Bulk approve users
export const bulkApproveUsers = async (userIds, adminId) => {
  try {
    const results = [];
    for (const userId of userIds) {
      const result = await approveUser(userId, adminId);
      results.push({ userId, ...result });
    }
    return { success: true, results };
  } catch (error) {
    console.error('Error bulk approving users:', error);
    return { success: false, message: error.message };
  }
};

// Bulk reject users
export const bulkRejectUsers = async (userIds, adminId) => {
  try {
    const results = [];
    for (const userId of userIds) {
      const result = await rejectUser(userId, adminId);
      results.push({ userId, ...result });
    }
    return { success: true, results };
  } catch (error) {
    console.error('Error bulk rejecting users:', error);
    return { success: false, message: error.message };
  }
};

// Search users
export const searchUsers = async (searchTerm) => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);

    const users = [];
    querySnapshot.forEach((doc) => {
      const userData = { id: doc.id, ...doc.data() };

      // Simple client-side search (for better performance, implement server-side search)
      const searchFields = [
        userData.name?.toLowerCase() || '',
        userData.email?.toLowerCase() || '',
        userData.department?.toLowerCase() || '',
        userData.role?.toLowerCase() || ''
      ];

      const searchLower = searchTerm.toLowerCase();
      if (searchFields.some(field => field.includes(searchLower))) {
        users.push(userData);
      }
    });

    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};


