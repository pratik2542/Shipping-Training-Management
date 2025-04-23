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
  
      try {
        // Query Firestore for documents where email == normalizedEmail
        const userRequestsRef = collection(db, 'userRequests');
        const q = query(userRequestsRef, where('email', '==', normalizedEmail));
        
        console.log('Running query:', JSON.stringify(q._query, null, 2));
        
        const querySnapshot = await getDocs(q);
        
        console.log('Query returned', querySnapshot.size, 'documents');
        
        if (querySnapshot.empty) {
          // Try a case-insensitive approach as a fallback
          console.log('Attempting case-insensitive search as fallback...');
          
          // Get all user requests and filter manually (inefficient but can help in testing)
          try {
            const allRequestsQuery = query(collection(db, 'userRequests'));
            const allRequestsSnapshot = await getDocs(allRequestsQuery);
            
            console.log('Retrieved', allRequestsSnapshot.size, 'total user requests');
            
            // Find any email that matches case-insensitively
            const matchingDocs = allRequestsSnapshot.docs.filter(doc => {
              const requestEmail = doc.data().email;
              return requestEmail && requestEmail.toLowerCase() === normalizedEmail;
            });
            
            if (matchingDocs.length > 0) {
              console.log('Found matching document with case-insensitive check:', matchingDocs[0].data());
              const userData = matchingDocs[0].data();
              
              navigate('/pending-status', {
                state: {
                  email: normalizedEmail,
                  status: userData.status || 'pending',
                  createdAt: userData.createdAt,
                  note: 'Found via case-insensitive search'
                }
              });
              return;
            } else {
              console.log('No matching documents found even with case-insensitive search');
            }
          } catch (fallbackError) {
            console.error('Error during fallback search:', fallbackError);
          }
          
          setError('No registration request found for this email. Please check the email address you registered with.');
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
      } catch (firestoreError) {
        console.error('Firestore operation failed:', firestoreError);
        
        // Special handling for permission errors
        if (firestoreError.code === 'permission-denied') {
          // Try server-side checking instead through an API endpoint (more secure approach)
          // If you have a server API that can check status securely, you can use it here
          
          // For now, navigate to a generic status screen
          navigate('/pending-status', {
            state: {
              email: normalizedEmail,
              status: 'pending', // Default value when we can't verify
              statusMessage: "We couldn't verify your exact status, but if you've registered, your request is being processed." 
            }
          });
        } else {
          throw firestoreError; // Re-throw for the outer catch block
        }
      }
    } catch (error) {
      console.error('Detailed error:', error);
      if (error.code === 'permission-denied') {
        setError('The status check system is currently undergoing maintenance. Please try again later or contact support.');
      } else {
        setError(`Error checking status: ${error.message}`);
      }
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
