import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Container } from '@mui/material';

// List of admin emails
const ADMIN_EMAILS = ['pratikmak2542@gmail.com']; // Replace with your admin email

export const isAdmin = async (uid) => {
  try {
    const q = query(
      collection(db, 'usersData'),
      where('uid', '==', uid),
      where('role', '==', 'admin')
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty || ADMIN_EMAILS.includes(auth.currentUser?.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export const AdminRoute = ({ children }) => {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        if (ADMIN_EMAILS.includes(user.email)) {
          setIsAdminUser(true);
        } else {
          const adminStatus = await isAdmin(user.uid);
          setIsAdminUser(adminStatus);
        }
      }
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return isAdminUser ? children : <Navigate to="/dashboard" />;
};
