import React from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <Header />
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        pt: 2,
        mt: 2 // Add additional top margin to account for fixed header
      }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
