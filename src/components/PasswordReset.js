import React, { useState, useEffect } from 'react';
import { Container, Paper, TextField, Button, Typography } from '@mui/material';
import { confirmPasswordReset, verifyPasswordResetCode, updatePassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const PasswordReset = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [isDirectReset, setIsDirectReset] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a direct reset from email link
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('oobCode');
    
    if (code) {
      setIsDirectReset(true);
      setOobCode(code);
      // Verify the code and get email
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          setEmail(email);
          setError('');
        })
        .catch((error) => {
          console.error('Error verifying reset code:', error);
          setError('Invalid or expired reset link');
        });
    } else {
      // This is a temp password reset after login
      const user = auth.currentUser;
      if (user) {
        setEmail(user.email);
      } else {
        setError('No user found. Please login again.');
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      if (isDirectReset) {
        // Handle direct reset from email link
        if (!oobCode) {
          throw new Error('Invalid reset link');
        }
        await confirmPasswordReset(auth, oobCode, password);
      } else {
        // Handle password change after temp password login
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No user found. Please login again.');
        }
        await updatePassword(user, password);
      }

      alert('Password has been set successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error setting password:', error);
      setError(error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" sx={{ mb: 3 }}>Reset Your Password</Typography>
        {email && (
          <Typography sx={{ mb: 2 }}>
            Resetting password for: {email}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 3 }}
          />
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={!email || (!oobCode && isDirectReset)}
          >
            Reset Password
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default PasswordReset;
