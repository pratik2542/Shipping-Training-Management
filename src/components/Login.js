import React, { useState } from 'react';
import { Paper, Avatar, Box, TextField, Button, Typography, Container } from '@mui/material';
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

  const sendAdminNotification = async (userData) => {
    try {
      const response = await fetch('/api/notify-admin', { // Remove localhost:5000 and use relative path
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
        throw new Error('Failed to send admin notification');
      }

      console.log('Admin notification sent successfully');
    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Don't throw error to prevent blocking registration
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent multiple submissions

    setIsSubmitting(true); // Start loading
    try {
      // Check if user already has a pending request
      const existingRequestQuery = query(
        collection(db, 'userRequests'),
        where('email', '==', email),
        where('status', '==', 'pending')
      );
      
      const existingRequestDocs = await getDocs(existingRequestQuery);
      if (!existingRequestDocs.empty) {
        alert('You already have a pending registration request.');
        setIsSubmitting(false);
        return;
      }

      const userRequest = {
        name,
        email,
        status: 'pending',
        createdAt: new Date().toISOString(),
        isTestUser: false
      };

      // Create user request in Firebase
      await addDoc(collection(db, 'userRequests'), userRequest);
      
      // Send notification to admin via local server
      await sendAdminNotification(userRequest);

      alert('Your registration request has been submitted. You will receive an email once approved.');
      navigate('/pending-status', { state: { email } });
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
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

      // Check if user is admin
      if (ADMIN_EMAILS.includes(email)) {
        // Check for pending requests
        const pendingQuery = query(
          collection(db, 'userRequests'),
          where('status', '==', 'pending')
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        
        localStorage.setItem('isAdmin', 'true');
        
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
                sx={{ mt: 3, mb: 2 }}
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
                sx={{ mt: 1 }}
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
                    size="large"
                    sx={{ 
                      py: 1.5,
                      fontSize: '1.1rem',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        transition: 'transform 0.2s',
                      }
                    }}
                  >
                    Sign In
                  </Button>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2 }}>
                    <Button
                      color="primary"
                      onClick={() => navigate('/check-status')}
                      sx={{ textTransform: 'none' }}
                    >
                      Check Registration Status
                    </Button>
                    <Button
                      color="primary"
                      onClick={() => navigate('/forgot-password')}
                      sx={{ textTransform: 'none' }}
                    >
                      Forgot password?
                    </Button>
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowRegister(true)}
                    sx={{ mt: 1 }}
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
                    sx={{ mt: 1 }}
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
                    sx={{ mt: 3, mb: 2 }}
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
                    sx={{ mt: 1 }}
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