import React, { useState } from 'react';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

/**
 * Provider component that wraps the app with session timeout functionality
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {number} props.timeoutMinutes - Timeout in minutes
 * @param {boolean} props.useDialog - Whether to use dialog for warning instead of alert
 * @returns {React.ReactNode} - Provider component
 */
const SessionTimeoutProvider = ({ 
  children, 
  timeoutMinutes = 15,
  useDialog = false // Set to true if you prefer dialog over alert
}) => {
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60); // seconds
  
  // Custom warning handler that can use either dialog or alert
  const warningHandler = (message) => {
    if (useDialog) {
      setShowWarningDialog(true);
      
      // Start countdown timer
      let timeLeft = 60;
      const countdownTimer = setInterval(() => {
        timeLeft -= 1;
        setRemainingTime(timeLeft);
        
        if (timeLeft <= 0) {
          clearInterval(countdownTimer);
        }
      }, 1000);
      
      // Clean up timer when dialog is dismissed
      return () => clearInterval(countdownTimer);
    } else {
      // Use default alert if dialog not requested
      alert(message);
    }
  };
  
  // Use the session timeout hook
  const { resetTimeout } = useSessionTimeout(timeoutMinutes, warningHandler);

  // Reset the session when user interacts with the warning dialog
  const handleContinueSession = () => {
    setShowWarningDialog(false);
    resetTimeout();
  };
  
  return (
    <>
      {children}
      
      {/* Warning Dialog (only shown if useDialog=true) */}
      <Dialog 
        open={showWarningDialog} 
        onClose={handleContinueSession}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon color="warning" />
          Session Timeout Warning
        </DialogTitle>
        <DialogContent>
          <Typography>
            Your session is about to expire due to inactivity.
          </Typography>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'warning.light', 
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'center'  
          }}>
            <Typography variant="h5">
              You will be logged out in {remainingTime} seconds
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleContinueSession} 
            variant="contained"
            fullWidth
          >
            Continue Session
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SessionTimeoutProvider;
