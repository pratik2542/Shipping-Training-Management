import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  CircularProgress, 
  Button,
  Box
} from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';

const PendingStatus = () => {
  const [status, setStatus] = useState('checking');
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const initialStatus = location.state?.status;

  useEffect(() => {
    const checkStatus = async () => {
      if (!email) {
        setStatus('error');
        return;
      }

      try {
        // If we already have the status from navigation state, use it
        if (initialStatus) {
          setStatus(initialStatus);
          return;
        }

        // Otherwise query Firestore
        const q = query(
          collection(db, 'userRequests'),
          where('email', '==', email.toLowerCase())
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setStatus(userData.status || 'pending');
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error checking status:', error);
        setStatus('error');
      }
    };

    checkStatus();
  }, [email, initialStatus]);

  // Modify getStatusDisplay to be more informative
  const getStatusDisplay = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <CircularProgress />,
          message: 'Checking registration status...',
          color: 'info.main'
        };
      case 'pending':
        return {
          icon: <PendingIcon sx={{ fontSize: 60, color: 'warning.main' }} />,
          message: `Your registration request for ${email} is pending approval. You will receive an email once approved.`,
          color: 'warning.main'
        };
      case 'approved':
        return {
          icon: <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />,
          message: 'Your registration has been approved! You can now log in.',
          color: 'success.main'
        };
      case 'rejected':
        return {
          icon: <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />,
          message: 'Your registration request was not approved. Please contact support.',
          color: 'error.main'
        };
      default:
        return {
          icon: <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />,
          message: 'No registration request found for this email. Please register first.',
          color: 'error.main'
        };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          {statusInfo.icon}
        </Box>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Registration Status
        </Typography>
        <Typography sx={{ mb: 4, color: statusInfo.color }}>
          {statusInfo.message}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Login
        </Button>
      </Paper>
    </Container>
  );
};

export default PendingStatus;
