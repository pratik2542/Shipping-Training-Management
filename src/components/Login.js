import React, { useState } from 'react';
import { Paper, Avatar, Box, TextField, Button, Typography, Container, Divider } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { testAuth } from '../firebase/testConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import HelpIcon from '@mui/icons-material/Help';
import { Tooltip, IconButton } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { getApiUrl } from '../config/api';
import SearchIcon from '@mui/icons-material/Search';
import LockResetIcon from '@mui/icons-material/LockReset';
import { verifyEmail } from '../utils/firebaseAuthApi';

const ADMIN_EMAILS = ['pratikmak2542@gmail.com']; // Add your admin emails here

const Login = () => {
  // Add this console log to verify which API URL is being used
  console.log('API URL:', process.env.REACT_APP_API_URL);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showTestSignup, setShowTestSignup] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isTestUser, setIsTestUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const buttonStyles = {
    py: 1.5,
    fontSize: '1rem',
    fontWeight: 500,
    height: '48px',
    textTransform: 'none', // Prevents all-caps
    letterSpacing: '0.3px',
    '&:hover': {
      transform: 'translateY(-2px)',
      transition: 'transform 0.2s',
    }
  };

  const outlinedButtonStyles = {
    ...buttonStyles,
    borderColor: 'primary.main',
    '&:hover': {
      ...buttonStyles['&:hover'],
      borderColor: 'primary.dark',
      backgroundColor: 'rgba(25, 118, 210, 0.04)'
    }
  };

  const utilityButtonStyles = {
    ...buttonStyles,
    height: '42px',
    backgroundColor: 'white',
    color: 'primary.main',
    border: '1px solid',
    borderColor: 'primary.light',
    fontWeight: 400,
    fontSize: '0.9rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    '& .MuiButton-startIcon': {
      marginRight: 1
    },
    '&:hover': {
      backgroundColor: 'primary.main',
      color: 'white',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      transform: 'translateY(-2px)',
      transition: 'all 0.2s ease-in-out'
    },
    minWidth: 130, // Ensure enough width for text
    whiteSpace: 'nowrap', // Prevent text wrapping
  };

  const sendAdminNotification = async (userData) => {
    console.log('Sending notification data:', userData);
    
    try {
      const response = await fetch(getApiUrl('notify-admin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }

      const data = await response.json();
      console.log('Server response:', data);
      return data;
    } catch (error) {
      console.error('Notification error:', error);
      throw new Error('Failed to send registration notification. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true); // Start loading
    setError(''); // Clear previous errors

    try {
      // Check if email exists in Firebase Auth using the secure helper
      const emailCheckResult = await verifyEmail(email);
      
      if (emailCheckResult.registered === true) {
        setError('An account with this email already exists. Please log in instead.');
        setIsSubmitting(false);
        return;
      }
      
      // Check if user already has a pending request
      const existingRequestQuery = query(
        collection(db, 'userRequests'),
        where('email', '==', email)
      );
      
      const existingRequestDocs = await getDocs(existingRequestQuery);
      
      // Check if there's any request (pending, approved, or rejected)
      if (!existingRequestDocs.empty) {
        // Find if there's an approved request
        const approvedRequest = existingRequestDocs.docs.find(doc => 
          doc.data().status === 'approved'
        );
        
        // Find if there's a pending request
        const pendingRequest = existingRequestDocs.docs.find(doc => 
          doc.data().status === 'pending'
        );
        
        if (approvedRequest) {
          setError('This email is already registered and approved. Please log in instead.');
          setIsSubmitting(false);
          return;
        }
        
        if (pendingRequest) {
          setError('You already have a pending registration request. Please wait for approval.');
          setIsSubmitting(false);
          return;
        }
        
        // If only rejected requests exist, allow to re-register
      }

      const userRequest = {
        name,
        email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        isTestUser: false
      };

      // Try to send notification first
      await sendAdminNotification(userRequest);
      
      // Only add to Firebase if notification succeeds
      await addDoc(collection(db, 'userRequests'), userRequest);

      alert('Registration request submitted successfully.');
      navigate('/pending-status', { state: { email } });
      
    } catch (error) {
      console.error('Registration failed:', error);
      setError(`Registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false); // End loading
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Sign in user
      await signInWithEmailAndPassword(auth, email, password);
      
      // If using temporary password, redirect to reset
      if (password === 'tempPassword123') {
        navigate('/reset-password', { state: { fromTempPassword: true } });
        return;
      }

      // Check if user is admin - use case-insensitive comparison
      const normalizedEmail = email.toLowerCase();
      const normalizedAdminEmails = ADMIN_EMAILS.map(email => email.toLowerCase());
      
      if (normalizedAdminEmails.includes(normalizedEmail)) {
        // Store admin email for later use in auth operations
        localStorage.setItem('adminEmail', email);
        localStorage.setItem('isAdmin', 'true');
        
        // Check for pending requests
        const pendingQuery = query(
          collection(db, 'userRequests'),
          where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        
        // Only redirect to verify page if there are pending requests
        if (pendingSnapshot.size > 0) {
          navigate('/admin/verify');
        } else {
          navigate('/dashboard');
        }
        return;
      }

      // For test users, use test auth and mark them as test users
      if (isTestUser) {
        await signInWithEmailAndPassword(testAuth, email, password);
        localStorage.setItem('isTestUser', 'true');
      } else {
        // Sign in and get user credentials
        await signInWithEmailAndPassword(auth, email, password);
        
        // Check if user is approved
        const userQuery = query(
          collection(db, 'userRequests'),
          where('email', '==', email),
          where('status', '==', 'pending')
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          await auth.signOut(); // Sign out if not approved
          setError('Your account is pending approval. Please wait for admin verification.');
          return;
        }

        localStorage.removeItem('isAdmin');
        localStorage.removeItem('isTestUser');
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleTestSignup = async (e) => {
    e.preventDefault();
    try {
      // Always create test users with testAuth and mark them as test users
      await createUserWithEmailAndPassword(testAuth, email, password);
      localStorage.setItem('isTestUser', 'true');
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          marginTop: 8,
          padding: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {showRegister ? 'Register' : showTestSignup ? 'Create Test Account' : 'Sign in'}
        </Typography>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <Box component="form" onSubmit={showRegister ? handleRegister : showTestSignup ? handleTestSignup : handleLogin} sx={{ mt: 1 }}>
          {showRegister ? (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ position: 'relative' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 3 }}
                />
                <Tooltip 
                  title="After your registration is approved, you'll receive an email with a temporary password to log in."
                  arrow
                  placement="top"
                >
                  <IconButton 
                    sx={{ 
                      position: 'absolute', 
                      right: -40, 
                      top: '50%', 
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <HelpIcon color="primary" fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ ...buttonStyles, mt: 3, mb: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Registering...
                  </Box>
                ) : (
                  'Register'
                )}
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setShowRegister(false);
                  setName('');
                }}
                sx={{ ...outlinedButtonStyles, mt: 1 }}
              >
                Back to Login
              </Button>
            </>
          ) : (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
              />
              {!showTestSignup && !showRegister ? (
                <>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={buttonStyles}
                  >
                    Sign In
                  </Button>
                  
                  {/* Updated utility buttons container with adjusted spacing */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', // Use space-between instead of gap
                    mt: 3, 
                    mb: 3,
                    width: '100%'
                  }}>
                    <Button
                      sx={{
                        ...utilityButtonStyles,
                        flex: '1 1 45%', // Allocate proper space
                        mr: 1 // Add margin right
                      }}
                      onClick={() => navigate('/check-status')}
                      startIcon={<SearchIcon sx={{ fontSize: 20 }} />}
                    >
                      Check Status
                    </Button>
                    <Button
                      sx={{
                        ...utilityButtonStyles,
                        flex: '1 1 45%', // Allocate proper space
                        ml: 1 // Add margin left
                      }}
                      onClick={() => navigate('/forgot-password')}
                      startIcon={<LockResetIcon sx={{ fontSize: 20 }} />}
                    >
                      Reset Password
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      or
                    </Typography>
                  </Divider>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowRegister(true)}
                    sx={{ ...outlinedButtonStyles, mb: 1 }}
                  >
                    Create Account
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setShowTestSignup(true);
                      setIsTestUser(true);
                    }}
                    sx={outlinedButtonStyles}
                  >
                    Create Test Account
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="warning"
                    sx={{ ...buttonStyles, mt: 3, mb: 2 }}
                  >
                    Create Test Account
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setShowTestSignup(false);
                      setIsTestUser(false);
                    }}
                    sx={{ ...outlinedButtonStyles, mt: 1 }}
                  >
                    Back to Login
                  </Button>
                </>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;