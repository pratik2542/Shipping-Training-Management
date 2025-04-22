import { collection, query, where, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Container } from '@mui/material';

const MANAGERS_COLLECTION = 'managers';

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
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const docSnap = await getDocs(query(collection(db, MANAGERS_COLLECTION), where('email', '==', user.email)));
    const isUserManager = !docSnap.empty;
    // Store in localStorage for quicker access in components like Sidebar
    localStorage.setItem('isManager', isUserManager ? 'true' : 'false');
    return isUserManager;
  } catch (error) {
    console.error('Error checking manager status:', error);
    localStorage.setItem('isManager', 'false'); // Ensure it's false on error
    return false;
  }
};

/**
 * Add a new manager
 * @param {string} email - Email of the manager to add
 * @returns {Promise<void>}
 */
export const addManager = async (email) => {
  const adminUser = auth.currentUser;
  if (!adminUser) throw new Error("Admin not authenticated");

  const normalizedEmail = email.toLowerCase();

  await setDoc(doc(db, MANAGERS_COLLECTION, normalizedEmail), {
    email: normalizedEmail,
    addedBy: adminUser.email,
    addedAt: new Date().toISOString()
  });
  console.log(`${normalizedEmail} added as manager.`);
};

/**
 * Remove a manager
 * @param {string} email - Email of the manager to remove
 * @returns {Promise<void>}
 */
export const removeManager = async (email) => {
  const normalizedEmail = email.toLowerCase();
  const managerDocRef = doc(db, MANAGERS_COLLECTION, normalizedEmail);
  await deleteDoc(managerDocRef);
  console.log(`${normalizedEmail} removed from managers.`);
};

/**
 * Get all managers
 * @returns {Promise<Array>} List of manager objects
 */
export const getAllManagers = async () => {
  const managersSnapshot = await getDocs(collection(db, MANAGERS_COLLECTION));
  return managersSnapshot.docs.map(doc => doc.data());
};

// Protected Route Component for Managers (and Admins)
export const ManagerRoute = ({ children }) => {
  const [isUserManager, setIsUserManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessLevel, setAccessLevel] = useState(null); // Add state for access level
  const user = auth.currentUser;

  useEffect(() => {
    const checkManagerAndAccess = async () => {
      if (user) {
        const managerStatus = await isManager(); // Checks and sets localStorage
        setIsUserManager(managerStatus);
        // Get access level from localStorage (set during login)
        const storedAccessLevel = localStorage.getItem('accessLevel');
        setAccessLevel(storedAccessLevel);
      }
      setLoading(false);
    };
    checkManagerAndAccess();
  }, [user]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  // Check for manager status AND appropriate access level
  const hasRequiredAccess = accessLevel === 'training' || accessLevel === 'both';

  if (isUserManager && hasRequiredAccess) {
    return children; // Allow access
  } else {
    // Redirect based on actual access level if not authorized as manager for training
    if (accessLevel === 'shipping') {
      return <Navigate to="/dashboard" />;
    } else if (accessLevel === 'training') {
      // If they have training access but aren't a manager, redirect to training dashboard
      return <Navigate to="/training" />;
    } else {
      // Default redirect if not manager or insufficient access
      return <Navigate to="/" />;
    }
  }
};

const userRoles = {
  isAdmin,
  isManager,
  addManager,
  removeManager,
  getAllManagers
};

export default userRoles;
