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
import SchoolIcon from '@mui/icons-material/School';
import { verifyEmail } from '../utils/firebaseAuthApi';

const ADMIN_EMAILS = ['pratikmak2542@gmail.com']; // Add your admin emails here

// Accept isTrainingLogin prop
const Login = ({ isTrainingLogin = false }) => {
  console.log('API URL:', process.env.REACT_APP_API_URL);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showTestSignup, setShowTestSignup] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const buttonStyles = {
    py: 1.5,
    fontSize: '1rem',
    fontWeight: 500,
    height: '48px',
    textTransform: 'none',
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
    minWidth: 130,
    whiteSpace: 'nowrap',
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
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const emailCheckResult = await verifyEmail(email);
      
      if (emailCheckResult.registered === true) {
        setError('An account with this email already exists. Please log in instead.');
        setIsSubmitting(false);
        return;
      }
      
      // Before checking existingRequests, let's verify if the user can access the collection
      try {
        // First try to send admin notification - this doesn't require Firestore permissions
        const userRequest = {
          name,
          email,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        // Send notification first, so at least admin gets informed even if DB write fails
        await sendAdminNotification(userRequest);
        
        // Now check for existing request
        const existingRequestQuery = query(
          collection(db, 'userRequests'),
          where('email', '==', email)
        );
        
        const existingRequestDocs = await getDocs(existingRequestQuery);
        
        if (!existingRequestDocs.empty) {
          const approvedRequest = existingRequestDocs.docs.find(doc => 
            doc.data().status === 'approved'
          );
          
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
        }

        // Only if all checks pass, try to add the document
        await addDoc(collection(db, 'userRequests'), userRequest);
        
        // If we reach here, everything worked
        alert('Registration request submitted successfully.');
        navigate('/pending-status', { state: { email } });
        
      } catch (firestoreError) {
        console.error('Firestore operation failed:', firestoreError);
        
        // If it's a permission error but notification was sent, show a more helpful message
        if (firestoreError.code === 'permission-denied') {
          alert('Your registration request has been sent to the administrator.');
          navigate('/pending-status', { state: { email } });
        } else {
          throw firestoreError; // Re-throw for the outer catch
        }
      }
    } catch (error) {
      console.error('Registration failed:', error);
      
      // More helpful error messages
      if (error.code === 'permission-denied') {
        setError('Registration system is currently undergoing maintenance. Please try again later or contact support.');
      } else {
        setError(`Registration failed: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      // Sign in user (use regular auth for both logins)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // If using temporary password, redirect to reset (applies to both logins)
      if (password === 'tempPassword123') {
        navigate('/reset-password', { state: { fromTempPassword: true } });
        return;
      }

      // Check if user is admin - use case-insensitive comparison
      const normalizedEmail = email.toLowerCase();
      const normalizedAdminEmails = ADMIN_EMAILS.map(email => email.toLowerCase());
      const isAdminUser = normalizedAdminEmails.includes(normalizedEmail);

      // --- Determine User Access Level and Redirect ---
      let accessLevel = 'both'; // Default access
      let userName = user.displayName || email.split('@')[0]; // Get username

      // Fetch user data from userRequests collection to get accessLevel
      const userQuery = query(collection(db, 'userRequests'), where('email', '==', normalizedEmail));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        // Check if approved
        if (userData.status !== 'approved' && !isAdminUser) {
           await auth.signOut(); // Sign out if not approved (and not admin)
           setError('Your account is pending approval or has been rejected.');
           return;
        }
        // Get access level if approved
        if (userData.status === 'approved') {
            accessLevel = userData.accessLevel || 'both'; // Use stored level or default to 'both'
        }
        userName = userData.name || userName; // Use name from request if available
      } else if (!isAdminUser) {
        // If no record found in userRequests and not an admin, deny login
        await auth.signOut();
        setError('User record not found. Please register or contact admin.');
        return;
      }

      // --- Store Session Info ---
      localStorage.setItem('userName', userName);
      localStorage.setItem('accessLevel', accessLevel); // Store access level
      localStorage.removeItem('isTestUser'); // Ensure test flag is removed

      if (isAdminUser) {
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminEmail', email);
      } else {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminEmail');
      }

      // --- Redirect based on context and access level ---
      if (isTrainingLogin) {
        // If trying to log into training system
        if (accessLevel === 'shipping') {
          await auth.signOut(); // Sign out if user only has shipping access
          localStorage.clear(); // Clear storage
          setError('You do not have access to the Training System.');
          return;
        }
        navigate('/training'); // Redirect to training dashboard
      } else {
        // If logging into main system
        if (accessLevel === 'training') {
          await auth.signOut(); // Sign out if user only has training access
          localStorage.clear(); // Clear storage
          setError('You only have access to the Training System. Please use the "Go to Training System" login.');
          return;
        }
        // For 'shipping' or 'both' access, or admin
        if (isAdminUser) {
            // Check for pending requests to decide where admin goes
            const pendingQuery = query(collection(db, 'userRequests'), where('status', '==', 'pending'));
            const pendingSnapshot = await getDocs(pendingQuery);
            if (pendingSnapshot.size > 0) {
                navigate('/admin/verify');
            } else {
                navigate('/dashboard');
            }
        } else {
             navigate('/dashboard'); // Redirect 'shipping' or 'both' users to main dashboard
        }
      }

    } catch (error) {
       console.error("Login error:", error);
       // Provide more specific error messages
       if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
           setError('Invalid email or password.');
       } else {
           setError(error.message);
       }
    }
  };

  const handleTestSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(testAuth, email, password);
      localStorage.setItem('isTestUser', 'true');
      localStorage.setItem('userName', email.split('@')[0]); // Set username for test user
      localStorage.removeItem('isAdmin'); // Ensure other flags are clear
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('accessLevel'); // Clear access level for test user
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
          {isTrainingLogin ? <SchoolIcon /> : <LockOutlinedIcon />}
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          {showRegister ? 'Register' : showTestSignup ? 'Create Test Account' : isTrainingLogin ? 'Training System Sign in' : 'Sign in'}
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

                  {!isTrainingLogin && (
                    <>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mt: 3, 
                        mb: 3,
                        width: '100%'
                      }}>
                        <Button
                          sx={{
                            ...utilityButtonStyles,
                            flex: '1 1 45%',
                            mr: 1
                          }}
                          onClick={() => navigate('/check-status')}
                          startIcon={<SearchIcon sx={{ fontSize: 20 }} />}
                        >
                          Check Status
                        </Button>
                        <Button
                          sx={{
                            ...utilityButtonStyles,
                            flex: '1 1 45%',
                            ml: 1
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
                        }}
                        sx={{ ...outlinedButtonStyles, mb: 1 }}
                      >
                        Create Test Account
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="secondary"
                        onClick={() => navigate('/login/training')}
                        startIcon={<SchoolIcon />}
                        sx={{ 
                          ...outlinedButtonStyles, 
                          borderColor: 'secondary.main', 
                          color: 'secondary.main', 
                          '&:hover': { 
                            borderColor: 'secondary.dark', 
                            backgroundColor: 'rgba(156, 39, 176, 0.04)' 
                          } 
                        }}
                      >
                        Go to Training System
                      </Button>
                    </>
                  )}
                  {isTrainingLogin && (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate('/')}
                      sx={{ ...outlinedButtonStyles, mt: 2 }}
                    >
                      Back to Main Login
                    </Button>
                  )}
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