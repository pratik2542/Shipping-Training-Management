import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { testAuth } from '../firebase/testConfig';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook to handle automatic session timeout after inactivity
 * @param {number} timeoutInMinutes - Timeout duration in minutes (default: 15)
 * @param {Function} warningCallback - Optional callback for showing warning
 * @returns {Object} - Object with a resetTimeout function
 */
const useSessionTimeout = (timeoutInMinutes = 15, warningCallback = null) => {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [warningShown, setWarningShown] = useState(false);
  const [logoutTriggered, setLogoutTriggered] = useState(false); // Add state to track logout
  const navigate = useNavigate();
  
  // Convert minutes to milliseconds
  const timeoutInMs = timeoutInMinutes * 60 * 1000;
  // Warning appears 1 minute before timeout
  const warningTimeInMs = (timeoutInMinutes - 1) * 60 * 1000;

  const resetTimeout = useCallback(() => {
    setLastActivity(Date.now());
    setWarningShown(false);
  }, []);

  // Enhanced logout function with better error handling
  const logout = useCallback(async () => {
    // Prevent multiple logout attempts
    if (logoutTriggered) return;
    setLogoutTriggered(true);
    
    console.log('Session timeout - executing logout...');
    
    try {
      // Determine which auth instance to use
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const authInstance = isTestUser ? testAuth : auth;
      
      // Get current authentication state
      const currentUser = authInstance.currentUser;
      if (!currentUser) {
        console.log('No user currently signed in');
        navigate('/');
        return;
      }
      
      console.log('Signing out user:', currentUser.email);
      
      // Clear all authentication data
      await signOut(authInstance);
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('isTestUser');
      
      console.log('User successfully signed out');
      
      // Navigate to login page
      navigate('/', { replace: true });
      
      // Show message about session timeout
      setTimeout(() => {
        alert('Your session has expired due to inactivity. Please log in again.');
      }, 100);
    } catch (error) {
      console.error('Error during auto-logout:', error);
      
      // Force navigation to login even if logout fails
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('isTestUser');
      navigate('/', { replace: true });
      
      setTimeout(() => {
        alert('Your session has expired. Please log in again.');
      }, 100);
    }
  }, [navigate, logoutTriggered]);

  useEffect(() => {
    // Skip session timeout for unauthenticated users
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const authInstance = isTestUser ? testAuth : auth;
    
    // Check if user is authenticated
    if (!authInstance.currentUser) {
      console.log('Session timeout not active - no authenticated user');
      return;
    }

    console.log('Session timeout monitoring activated:', timeoutInMinutes, 'minutes');
    
    // Setup activity tracking
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 
      'scroll', 'touchstart', 'click', 'touchmove'
    ];
    
    const handleActivity = () => {
      resetTimeout();
    };
    
    // Add event listeners for all activity events
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check timer at regular intervals
    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivity;
      
      // Debug logging
      if (elapsed > (timeoutInMs - 60000) && elapsed <= timeoutInMs) {
        console.log(`Session timeout in: ${Math.ceil((timeoutInMs - elapsed) / 1000)} seconds`);
      }
      
      // Show warning before logout
      if (elapsed > warningTimeInMs && !warningShown) {
        setWarningShown(true);
        console.log('Showing session timeout warning');
        
        // Use custom warning callback if provided
        if (typeof warningCallback === 'function') {
          warningCallback(`Warning: You'll be logged out due to inactivity in 1 minute.`);
        } else {
          alert(`Warning: You'll be logged out due to inactivity in 1 minute.`);
        }
      }
      
      // Auto logout
      if (elapsed > timeoutInMs) {
        console.log('Session timeout reached, triggering logout');
        logout();
        // Clear the interval to prevent multiple logout attempts
        clearInterval(intervalId);
      }
    }, 5000); // Check every 5 seconds

    // Cleanup listeners
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [
    lastActivity, warningShown, timeoutInMs, warningTimeInMs, 
    logout, resetTimeout, timeoutInMinutes, warningCallback
  ]);

  // Return functions to interact with the session timeout
  return { resetTimeout };
};

export default useSessionTimeout;