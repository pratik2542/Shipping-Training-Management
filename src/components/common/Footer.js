import React from 'react';
import { Box, Typography, Link, Container, Divider } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom'; // Import useLocation

const Footer = () => {
  const location = useLocation(); // Get current location
  const isTrainingSystem = location.pathname.startsWith('/training'); // Check if path starts with /training

  return (
    <Box 
      component="footer" 
      sx={{ 
        bgcolor: 'background.paper', 
        py: 3, 
        mt: 'auto' 
      }}
    >
      <Divider />
      <Container maxWidth="lg">
        <Box 
          sx={{ 
            pt: 2,
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{ mb: { xs: 1, sm: 0 } }}
          >
            {/* Conditionally render copyright text */}
            {isTrainingSystem 
              ? '© 2025 PM Training System' 
              : '© 2025 PM Management System'}
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex',
              gap: 2,
              justifyContent: 'center'
            }}
          >
            <Link 
              component={RouterLink}
              to="/terms" 
              color="inherit" 
              underline="hover" 
              variant="body2"
            >
              Terms & Conditions
            </Link>
            <Link 
              component={RouterLink}
              to="/privacy" 
              color="inherit" 
              underline="hover" 
              variant="body2"
            >
              Privacy Policy
            </Link>
            <Link 
              component={RouterLink}
              to="/help" 
              color="inherit" 
              underline="hover" 
              variant="body2"
            >
              Help
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
