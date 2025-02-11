import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email, {
        url: 'http://localhost:3000/reset-password', // Change this to your production URL in production
        handleCodeInApp: true,
      });
      setSuccess(true);
      setError('');
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message);
      setSuccess(false);
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
          Reset Password
        </Typography>

        {success ? (
          <Box>
            <Typography color="success.main" sx={{ mb: 2 }}>
              If your account exists in our system, a password reset link will be sent to your email.
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate('/')}
            >
              Return to Login
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 3 }}
            />
            
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
            >
              Send Reset Link
            </Button>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
