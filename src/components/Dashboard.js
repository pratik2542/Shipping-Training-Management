import React, { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, Badge, Snackbar, Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScienceIcon from '@mui/icons-material/Science';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import InventoryIcon from '@mui/icons-material/Inventory';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { isManager } from '../utils/userRoles';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUserManager, setIsUserManager] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
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
      
      // Check if the user is a manager
      try {
        const managerStatus = await isManager();
        setIsUserManager(managerStatus);
      } catch (error) {
        console.error("Error checking manager status:", error);
        setIsUserManager(false);
      }
    };
    
    checkAdminAndPending();
  }, []);

  return (
    <Container maxWidth="md">
      {/* Remove welcome message and logout button */}
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
            Shipment
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => navigate('/shipment')}
            sx={{ mt: 2 }}
          >
            Manage Shipments
          </Button>
        </Paper>

        {/* Remove the separate shipment and records cards and add Manufacturing and Item Master */}
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
          <InventoryIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Item Master Data
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => navigate('/item-master')}
            sx={{ mt: 2 }}
          >
            Manage Items
          </Button>
        </Paper>
      </Box>
      {(isAdmin || localStorage.getItem('isTestUser') === 'true' || isUserManager) ? (
        <Box sx={{ mt: 4 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 3, 
              color: 'primary.dark',
              fontWeight: 600,
              textAlign: 'center' 
            }}
          >
            {isAdmin ? 'Admin Controls' : ''}
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
                backgroundColor: '#f0f7ff', // Light blue background instead of purple
                mb: 3
              }}
            >
              <SupervisorAccountIcon sx={{ fontSize: 60, color: 'primary.dark', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}> {/* Changed from white to text.primary */}
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
                  backgroundColor: 'primary.main', // Changed from secondary.dark to primary.main
                  '&:hover': {
                    backgroundColor: 'primary.dark', // Changed to match primary theme
                  }
                }}
              >
                Manage Users
                {pendingCount > 0 && ` (${pendingCount} Pending)`}
              </Button>
            </Paper>
          )}
          
          
        </Box>
      ) : null}
    </Container>
  );
};

export default Dashboard;