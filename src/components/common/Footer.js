import React from 'react';
import { Box, Typography, Link, Container, Divider } from '@mui/material';

const Footer = () => {
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
            © {new Date().getFullYear()} PM Management System
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex',
              gap: 2,
              justifyContent: 'center'
            }}
          >
            <Link 
              href="#" 
              color="inherit" 
              underline="hover" 
              variant="body2"
            >
              Terms & Conditions
            </Link>
            <Link 
              href="#" 
              color="inherit" 
              underline="hover" 
              variant="body2"
            >
              Privacy Policy
            </Link>
            <Link 
              href="#" 
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
