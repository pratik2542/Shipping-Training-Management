import React from 'react';
import { Container, Grid, Paper, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home'; // Add this import

const manufacturingForms = [
  {
    name: 'Vitamin D',
    path: 'vitamin-d',
    components: [
      { name: 'Vitamin D3', fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity'] }
      // Add other components as needed
    ]
  },
  {
    name: 'Menthol',
    path: 'menthol',
    components: [
      { name: 'Menthol Crystal', fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity'] }
      // Add other components as needed
    ]
  },
  {
    name: 'DHA',
    path: 'dha',
    components: [
      { name: 'DHA Oil', fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity'] }
      // Add other components as needed
    ]
  },
  {
    name: 'Tummy Relief',
    path: 'tummy-relief',
    components: [
      { name: 'Fennel Extract', fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity'] }
      // Add other components as needed
    ]
  },
  {
    name: 'Vitamin D + K',
    path: 'vitamin-d-k',
    components: [
      { name: 'Vitamin D3', fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity'] },
      { name: 'Vitamin K2', fields: ['lotNumber', 'itemNumber', 'expDate', 'releaseDate', 'quantity'] }
      // Add other components as needed
    ]
  }
];

const Manufacturing = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 2,
          mb: 4 
        }}>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
            fullWidth
            sx={{ 
              maxWidth: { xs: '100%', sm: '200px' } // Full width on mobile, fixed width on desktop
            }}
          >
            Back to Dashboard
          </Button>
          <Typography 
            variant="h4" 
            sx={{ 
              color: 'primary.main',
              fontSize: { xs: '1.5rem', sm: '2rem' },
              textAlign: 'center',
              order: { xs: -1, sm: 0 } // Move title to top on mobile
            }}
          >
            Manufacturing Forms
          </Typography>
          <Box sx={{ 
            width: { xs: '100%', sm: '200px' },
            display: { xs: 'none', sm: 'block' } 
          }} /> {/* Hidden on mobile, maintains layout on desktop */}
        </Box>
        <Grid container spacing={3}>
          {manufacturingForms.map((form) => (
            <Grid item xs={12} sm={6} md={4} mb={4} key={form.path}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  {form.name}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(`/manufacturing/${form.path}`)}
                  sx={{ mt: 2 }}
                >
                  Create Form
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Manufacturing;
