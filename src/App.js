import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { theme } from './theme/index';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { auth } from './firebase/config';
import { testAuth } from './firebase/testConfig';
import { AdminRoute } from './utils/adminCheck';
import { ManagerRoute } from './utils/userRoles'; // Keep ManagerRoute
import ScrollToTop from './components/ScrollToTop';
import SessionTimeoutProvider from './components/SessionTimeoutProvider';
import { initializeItemMasterData } from './utils/itemMasterData';
import Layout from './components/common/Layout'; // Import the Layout component

// Use lazy loading for routes
const Login = React.lazy(() => import('./components/Login'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Shipment = React.lazy(() => import('./components/Shipment')); // Add new Shipment component
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
const ItemMasterTable = React.lazy(() => import('./components/ItemMasterTable'));
const Terms = React.lazy(() => import('./components/Terms'));
const Privacy = React.lazy(() => import('./components/Privacy'));
const Help = React.lazy(() => import('./components/Help'));
const TrainingDashboard = React.lazy(() => import('./components/TrainingDashboard')); // Import TrainingDashboard
const TrainingRecords = React.lazy(() => import('./components/TrainingRecords'));
const SelfTrainingForm = React.lazy(() => import('./components/SelfTrainingForm'));
const InClassTrainingForm = React.lazy(() => import('./components/InClassTrainingForm'));
const ApproveTraining = React.lazy(() => import('./components/ApproveTraining')); // Import ApproveTraining
const AllTrainingRecords = React.lazy(() => import('./components/AllTrainingRecords')); // Import AllTrainingRecords

function App() {
  // Add error logging
  React.useEffect(() => {
    console.log('App mounted');
    
    // Initialize item master data
    initializeItemMasterData().catch(err => {
      console.error('Error initializing item data:', err);
    });
    
    // Log any Firebase initialization errors
    if (window.fbError) {
      console.error('Firebase initialization error:', window.fbError);
    }
  }, []);

  // Modified ProtectedRoute
  const ProtectedRoute = ({ children, requiredAccess }) => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const authInstance = isTestUser ? testAuth : auth;
    const user = authInstance.currentUser;
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const accessLevel = localStorage.getItem('accessLevel'); // 'shipping', 'training', or 'both'

    if (!user) {
      return <Navigate to="/" />;
    }

    // Admins have access to everything
    if (isAdmin) {
      return (
        <SessionTimeoutProvider timeoutMinutes={15}>
          <Layout>
            {children}
          </Layout>
        </SessionTimeoutProvider>
      );
    }

    // Check required access if specified
    if (requiredAccess) {
      const hasAccess = accessLevel === 'both' || accessLevel === requiredAccess;
      if (!hasAccess) {
        // Redirect based on the user's actual access level
        if (accessLevel === 'shipping') {
          return <Navigate to="/dashboard" />; // Redirect to main dashboard
        } else if (accessLevel === 'training') {
          return <Navigate to="/training" />; // Redirect to training dashboard
        } else {
          // If access level is somehow invalid or missing, redirect to login
          return <Navigate to="/" />;
        }
      }
    }

    // If authenticated and access is granted (or no specific access required)
    return (
      <SessionTimeoutProvider timeoutMinutes={15}>
        <Layout>
          {children}
        </Layout>
      </SessionTimeoutProvider>
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
            {/* Public routes - no Layout */}
            <Route path="/" element={<Login />} />
            {/* Add new route for training login */}
            <Route path="/login/training" element={<Login isTrainingLogin={true} />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/pending-status" element={<PendingStatus />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/check-status" element={<CheckStatus />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/help" element={<Help />} />
            
            {/* Protected routes with Layout */}
            {/* Shipping System Routes (require 'shipping' or 'both') */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Add new shipment hub route */}
            <Route
              path="/shipment"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <Shipment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipping-form"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <ShippingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/records"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <Records />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <Manufacturing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/:formType"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <Manufacturing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/vitamin-d"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <VitaminDForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/menthol"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <MentholForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/dha"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <DhaForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/tummy-relief"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <TummyReliefForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manufacturing/vitamin-d-k"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <VitaminDKForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/item-master"
              element={
                <ProtectedRoute requiredAccess="shipping">
                  <ItemMasterTable />
                </ProtectedRoute>
              }
            />

            {/* Training System Routes (require 'training' or 'both') */}
            <Route
              path="/training"
              element={
                <ProtectedRoute requiredAccess="training">
                  <TrainingDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/training/records"
              element={
                <ProtectedRoute requiredAccess="training">
                  <TrainingRecords />
                </ProtectedRoute>
              }
            />
            <Route
              path="/training/self-training-form"
              element={
                <ProtectedRoute requiredAccess="training">
                  <SelfTrainingForm />
                </ProtectedRoute>
              }
            />

            {/* Manager Only Training Routes (ManagerRoute handles manager check + training access) */}
            <Route
              path="/training/approve"
              element={
                <ManagerRoute>
                  <Layout>
                    <ApproveTraining />
                  </Layout>
                </ManagerRoute>
              }
            />
            <Route
              path="/training/all-records"
              element={
                <ManagerRoute>
                  <Layout>
                    <AllTrainingRecords />
                  </Layout>
                </ManagerRoute>
              }
            />
            <Route
              path="/training/in-class-training-form"
              element={
                <ManagerRoute>
                  <Layout>
                    <InClassTrainingForm />
                  </Layout>
                </ManagerRoute>
              }
            />

            {/* Admin Only Route */}
            <Route
              path="/admin/verify"
              element={
                <AdminRoute>
                  <Layout>
                    <AdminVerification />
                  </Layout>
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