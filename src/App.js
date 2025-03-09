import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { theme } from './theme/index';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { auth } from './firebase/config';
import { testAuth } from './firebase/testConfig';
import { AdminRoute } from './utils/adminCheck';
import ScrollToTop from './components/ScrollToTop';
import SessionTimeoutProvider from './components/SessionTimeoutProvider'; // Add this import

// Use lazy loading for routes
const Login = React.lazy(() => import('./components/Login'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const ShippingForm = React.lazy(() => import('./components/ShippingForm'));
const Records = React.lazy(() => import('./components/Records'));
const Manufacturing = React.lazy(() => import('./components/Manufacturing/Manufacturing'));
const VitaminDForm = React.lazy(() => import('./components/Manufacturing/forms/VitaminDForm'));
const MentholForm = React.lazy(() => import('./components/Manufacturing/forms/MentholForm'));
const DhaForm = React.lazy(() => import('./components/Manufacturing/forms/DhaForm'));
const TummyReliefForm = React.lazy(() => import('./components/Manufacturing/forms/TummyReliefForm'));
const VitaminDKForm = React.lazy(() => import('./components/Manufacturing/forms/VitaminDKForm'));
const AdminVerification = React.lazy(() => import('./components/AdminVerification'));
const PasswordReset = React.lazy(() => import('./components/PasswordReset'));
const PendingStatus = React.lazy(() => import('./components/PendingStatus'));
const ForgotPassword = React.lazy(() => import('./components/ForgotPassword'));
const CheckStatus = React.lazy(() => import('./components/CheckStatus'));
// Import other form components...

function App() {
  // Add error logging
  React.useEffect(() => {
    console.log('App mounted');
    // Log any Firebase initialization errors
    if (window.fbError) {
      console.error('Firebase initialization error:', window.fbError);
    }
  }, []);

  const ProtectedRoute = ({ children }) => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const authInstance = isTestUser ? testAuth : auth;
    return authInstance.currentUser ? (
      // Wrap protected routes with SessionTimeoutProvider
      <SessionTimeoutProvider timeoutMinutes={15}>
        {children}
      </SessionTimeoutProvider>
    ) : (
      <Navigate to="/" />
    );
  };

  // Loading component
  const LoadingFallback = () => (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="100vh"
    >
      <CircularProgress />
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Login />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/pending-status" element={<PendingStatus />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/check-status" element={<CheckStatus />} />
            
            {/* Protected routes - already wrapped in ProtectedRoute */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipping-form"
              element={
                <ProtectedRoute>
                  <ShippingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/records"
              element={
                <ProtectedRoute>
                  <Records />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing"
              element={
                <ProtectedRoute>
                  <Manufacturing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/:formType"
              element={
                <ProtectedRoute>
                  <Manufacturing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/vitamin-d"
              element={
                <ProtectedRoute>
                  <VitaminDForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/menthol"
              element={
                <ProtectedRoute>
                  <MentholForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/dha"
              element={
                <ProtectedRoute>
                  <DhaForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/tummy-relief"
              element={
                <ProtectedRoute>
                  <TummyReliefForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/vitamin-d-k"
              element={
                <ProtectedRoute>
                  <VitaminDKForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verify"
              element={
                <AdminRoute>
                  <AdminVerification />
                </AdminRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;