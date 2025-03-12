import React from 'react';
import { Container, Typography, Box, Paper, Button, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';

const Shipment = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        sx={{ 
          textAlign: 'center', 
          mt: 2, // Reduced top margin
          mb: 3, // Reduced bottom margin
          fontWeight: 600,
          color: 'primary.main'
        }}
      >
        Shipment Management
      </Typography>

      <Grid container spacing={3}> {/* Reduced spacing between items */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3, // Reduced padding
              height: 'auto', // Changed from 100% to auto
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}> {/* Reduced bottom margin */}
              <LocalShippingIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} /> {/* Reduced icon size and margin */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}> {/* Changed from h5 to h6, reduced margin */}
                Create New Shipment
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}> {/* Changed to body2, reduced margin */}
                Create a new shipment order with item details, quantities, and tracking information.
              </Typography>
            </Box>
            <Box sx={{ mt: 'auto' }}>
              <Button
                variant="contained"
                size="medium" // Changed from large to medium
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => navigate('/shipping-form')}
                sx={{ py: 1 }} // Reduced vertical padding
              >
                Create Shipment
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3, // Reduced padding
              height: 'auto', // Changed from 100% to auto
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: 6
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}> {/* Reduced bottom margin */}
              <ListAltIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} /> {/* Reduced icon size and margin */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}> {/* Changed from h5 to h6, reduced margin */}
                View Shipments
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, textAlign: 'center', color: 'text.secondary' }}> {/* Changed to body2, reduced margin */}
                View, search, and manage all your existing shipments. Track status and generate reports.
              </Typography>
            </Box>
            <Box sx={{ mt: 'auto' }}>
              <Button
                variant="contained"
                size="medium" // Changed from large to medium
                fullWidth
                startIcon={<VisibilityIcon />}
                onClick={() => navigate('/records')}
                sx={{ py: 1 }} // Reduced vertical padding
              >
                View All Shipments
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Shipment;
