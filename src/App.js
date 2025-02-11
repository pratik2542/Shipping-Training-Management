import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ShippingForm from './components/ShippingForm';
import Records from './components/Records';
import { auth } from './firebase/config';
import { testAuth } from './firebase/testConfig';
import { ThemeProvider } from '@mui/material';
import { theme } from './theme/index';
import Manufacturing from './components/Manufacturing/Manufacturing';
import VitaminDForm from './components/Manufacturing/forms/VitaminDForm';
import MentholForm from './components/Manufacturing/forms/MentholForm';
import DhaForm from './components/Manufacturing/forms/DhaForm';
import TummyReliefForm from './components/Manufacturing/forms/TummyReliefForm';
import VitaminDKForm from './components/Manufacturing/forms/VitaminDKForm';
import AdminVerification from './components/AdminVerification';
import PasswordReset from './components/PasswordReset';
import PendingStatus from './components/PendingStatus';
import { AdminRoute } from './utils/adminCheck';
import ForgotPassword from './components/ForgotPassword';
import CheckStatus from './components/CheckStatus';
// Import other form components...

function App() {
  const ProtectedRoute = ({ children }) => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const authInstance = isTestUser ? testAuth : auth;
    return authInstance.currentUser ? children : <Navigate to="/" />;
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
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
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/pending-status" element={<PendingStatus />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/check-status" element={<CheckStatus />} />
          {/* Add similar routes for other forms */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;