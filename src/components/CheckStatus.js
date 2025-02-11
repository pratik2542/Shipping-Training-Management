import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
//import { doc, getDoc } from 'firebase/firestore'; // Changed import
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
const CheckStatus = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      const normalizedEmail = email.toLowerCase();
      console.log('Checking status for email:', normalizedEmail);
  
      // Query Firestore for documents where email == normalizedEmail
      const userRequestsRef = collection(db, 'userRequests');
      const q = query(userRequestsRef, where('email', '==', normalizedEmail));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        setError('No registration request found for this email');
        setIsLoading(false);
        return;
      }
  
      // Get the first document from the query result
      const docSnap = querySnapshot.docs[0];
      const userData = docSnap.data();
  
      console.log('Found user data:', userData);
  
      navigate('/pending-status', {
        state: {
          email: normalizedEmail,
          status: userData.status || 'pending',
          createdAt: userData.createdAt
        }
      });
    } catch (error) {
      console.error('Detailed error:', error);
      setError(`Error checking status: ${error.message}`);
      setIsLoading(false);
    }
  };
  

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Login
        </Button>

        <Typography variant="h5" sx={{ mb: 3 }}>
          Check Registration Status
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!error}
            helperText={error}
            disabled={isLoading}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Check Status'
            )}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default CheckStatus;
