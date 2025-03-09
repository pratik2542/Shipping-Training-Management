import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Paper, Typography, Badge, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import ScienceIcon from '@mui/icons-material/Science';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import InventoryIcon from '@mui/icons-material/Inventory';
import { signOut } from 'firebase/auth';
import { collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { testAuth, testDb } from '../firebase/testConfig';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const getUserName = async () => {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const user = isTestUser ? testAuth.currentUser : auth.currentUser;
      
      if (user) {
        if (isTestUser) {
          // For test users, just use their email as name
          setUserName(user.email.split('@')[0]); // Gets username part of email
        } else {
          // For regular users, get name from userRequests
          const userQuery = query(
            collection(db, 'userRequests'),
            where('email', '==', user.email),
            where('status', '==', 'approved')
          );
          
          try {
            const querySnapshot = await getDocs(userQuery);
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              setUserName(userData.name || 'User');
            }
          } catch (error) {
            console.error('Error fetching user name:', error);
            setUserName('User');
          }
        }
      }
    };

    getUserName();

    const checkAdminAndPending = async () => {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const storedAdmin = localStorage.getItem('isAdmin') === 'true';
      
      // Only set admin if user is not a test user and is an admin
      if (storedAdmin && !isTestUser) {
        setIsAdmin(true);
        // Check for pending requests
        const pendingQuery = query(
          collection(db, 'userRequests'),
          where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        const count = pendingSnapshot.size;
        setPendingCount(count);
        setShowNotification(count > 0);
      }
    };
    
    checkAdminAndPending();
  }, []);

  const cleanupTestData = async () => {
    try {
      console.log('Starting test data cleanup...');
      
      // 1. Delete test_shipments documents
      const shipmentSnapshot = await getDocs(collection(testDb, 'test_shipments'));
      console.log(`Found ${shipmentSnapshot.size} test shipment records to delete`);
      
      const shipmentPromises = shipmentSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(shipmentPromises);
      console.log('Test shipment data deleted');
      
      // 2. Delete test_item_master documents
      const itemSnapshot = await getDocs(collection(testDb, 'test_item_master'));
      console.log(`Found ${itemSnapshot.size} test item records to delete`);
      
      const itemPromises = itemSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(itemPromises);
      console.log('Test item master data deleted');

      // 3. Delete test user account
      const user = testAuth.currentUser;
      if (user) {
        await user.delete();
        console.log('Test user account deleted');
      }
      
      console.log('Test data cleanup completed successfully');
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      
      if (isTestUser) {
        // First clean up all test data
        await cleanupTestData();
        // Then sign out
        await signOut(testAuth);
      } else {
        await signOut(auth);
      }
      
      localStorage.removeItem('isTestUser');
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still try to navigate away even if there's an error
      localStorage.removeItem('isTestUser');
      navigate('/');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mt: 2 
      }}>
        <Typography variant="h6" color="primary">
          Welcome, {userName}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          textAlign: 'center', 
          mt: 4, 
          mb: 4,
          fontWeight: 600,
          color: 'primary.main'
        }}
      >
        Shipping Management Dashboard
      </Typography>

      {/* Add Snackbar for notification */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={() => setShowNotification(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="info" 
          onClose={() => setShowNotification(false)}
          sx={{ width: '100%' }}
        >
          {pendingCount} user registration {pendingCount === 1 ? 'request' : 'requests'} pending approval
        </Alert>
      </Snackbar>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          gap: 3,
          padding: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 3,
            textAlign: 'center',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
            },
          }}
        >
          <LocalShippingIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create New Shipment
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => navigate('/shipping-form')}
            sx={{ mt: 2 }}
          >
            Create Form
          </Button>
        </Paper>

        <Paper
          elevation={3}
          sx={{
            p: 3,
            textAlign: 'center',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
            },
          }}
        >
          <ListAltIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            View Shipments
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => navigate('/records')}
            sx={{ mt: 2 }}
          >
            View Records
          </Button>
        </Paper>

        <Paper
          elevation={3}
          sx={{
            p: 3,
            textAlign: 'center',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
            },
          }}
        >
          <ScienceIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Manufacturing
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => navigate('/manufacturing')}
            sx={{ mt: 2 }}
          >
            Manufacturing
          </Button>
        </Paper>
      </Box>
      {isAdmin || localStorage.getItem('isTestUser') === 'true' ? (
        <Box sx={{ mt: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              color: 'secondary.main',
              fontWeight: 600,
              textAlign: 'center' 
            }}
          >
            {isAdmin ? 'Admin Controls' : 'Additional Features'}
          </Typography>
          
          {/* Only show User Verification for actual admin */}
          {isAdmin && (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                textAlign: 'center',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
                backgroundColor: 'secondary.light',
                mb: 3
              }}
            >
              <SupervisorAccountIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
                User Verification
                {pendingCount > 0 && (
                  <Badge 
                    badgeContent={pendingCount} 
                    color="error" 
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => navigate('/admin/verify')}
                sx={{ 
                  mt: 2,
                  backgroundColor: 'secondary.dark',
                  '&:hover': {
                    backgroundColor: 'secondary.main',
                  }
                }}
              >
                Manage Users
                {pendingCount > 0 && ` (${pendingCount} Pending)`}
              </Button>
            </Paper>
          )}
          
          {/* Show Item Master for both admin and test users */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              textAlign: 'center',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
              backgroundColor: '#f0f7ff',
            }}
          >
            <InventoryIcon sx={{ fontSize: 60, color: 'primary.dark', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Item Master Data
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigate('/item-master')}
              sx={{ 
                mt: 2,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
            >
              Manage Items
            </Button>
          </Paper>
        </Box>
      ) : null}
    </Container>
  );
};

export default Dashboard;