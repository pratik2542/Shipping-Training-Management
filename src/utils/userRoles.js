import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { testAuth, testDb } from '../firebase/testConfig';

// Admin emails hardcoded for security
const ADMIN_EMAILS = ['pratikmak2542@gmail.com'];

/**
 * Check if the current user is an admin
 * @returns {boolean} True if the user is an admin
 */
export const isAdmin = () => {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) return false;
  
  return ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
};

/**
 * Check if the current user is a manager with item master access
 * @returns {Promise<boolean>} True if the user has manager access
 */
export const isManager = async () => {
  try {
    const currentUser = auth.currentUser || testAuth.currentUser;
    if (!currentUser || !currentUser.email) return false;
    
    // Admins have full manager privileges
    if (ADMIN_EMAILS.includes(currentUser.email.toLowerCase())) return true;
    
    // Check if user is a test user
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    if (isTestUser) return true; // Test users have manager access
    
    // Check managers collection to see if this user's email is included
    const dbInstance = isTestUser ? testDb : db;
    const userEmail = currentUser.email.toLowerCase();
    
    // Fix: Query by using the document ID directly, since we store managers by email
    // First try looking by document ID
    const managerDocRef = doc(dbInstance, 'managers', userEmail);
    const managerDoc = await getDoc(managerDocRef);
    
    if (managerDoc.exists()) {
      return true;
    }
    
    // As fallback, try querying by email field
    const managerQuery = query(
      collection(dbInstance, 'managers'), 
      where('email', '==', userEmail)
    );
    
    const querySnapshot = await getDocs(managerQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking manager status:', error);
    return false;
  }
};

/**
 * Add a new manager
 * @param {string} email - Email of the manager to add
 * @returns {Promise<void>}
 */
export const addManager = async (email) => {
  if (!isAdmin()) throw new Error('Only admins can add managers');
  if (!email) throw new Error('Email is required');
  
  const normalizedEmail = email.toLowerCase().trim();
  
  await setDoc(doc(db, 'managers', normalizedEmail), {
    email: normalizedEmail,
    addedBy: auth.currentUser.email,
    addedAt: new Date().toISOString()
  });
};

/**
 * Remove a manager
 * @param {string} email - Email of the manager to remove
 * @returns {Promise<void>}
 */
export const removeManager = async (email) => {
  if (!isAdmin()) throw new Error('Only admins can remove managers');
  if (!email) throw new Error('Email is required');
  
  const normalizedEmail = email.toLowerCase().trim();
  await deleteDoc(doc(db, 'managers', normalizedEmail));
};

/**
 * Get all managers
 * @returns {Promise<Array>} List of manager objects
 */
export const getAllManagers = async () => {
  if (!isAdmin()) throw new Error('Only admins can view all managers');
  
  const querySnapshot = await getDocs(collection(db, 'managers'));
  return querySnapshot.docs.map(doc => doc.data());
};

const userRoles = {
  isAdmin,
  isManager,
  addManager,
  removeManager,
  getAllManagers
};

export default userRoles;
