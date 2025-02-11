import React, { useState, useEffect, useCallback } from 'react';
import { Container, Paper, Typography, Grid, TextField, Button, Box } from '@mui/material';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { testDb } from '../../../firebase/testConfig';  // Fix import path
import { useNavigate } from 'react-router-dom';

const ManufacturingFormBase = ({ formTitle, components, collectionName }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dpNumber: '',
    manufacturingDate: '',
    components: components.reduce((acc, comp) => ({
      ...acc,
      [comp.name]: {
        lotNumber: '',
        itemNumber: '',
        expDate: '',
        releaseDate: '',
        quantity: ''
      }
    }), {})
  });

  const generateDPNumber = useCallback(async () => {
    const dbInstance = localStorage.getItem('isTestUser') === 'true' ? testDb : db;
    const year = new Date().getFullYear().toString().slice(-2);
    
    try {
      // Query all collections for the latest DP number
      const collections = ['shipments', 'manufacturing_vitamin_d', 'manufacturing_menthol', 
                         'manufacturing_dha', 'manufacturing_tummy_relief', 'manufacturing_vitamin_dk'];
      
      let highestNumber = 0;

      for (const col of collections) {
        const q = query(
          collection(dbInstance, col),
          orderBy('dpNumber', 'desc'),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const lastDoc = querySnapshot.docs[0].data();
          const lastNumber = parseInt(lastDoc.dpNumber.slice(-3));
          if (lastNumber > highestNumber) {
            highestNumber = lastNumber;
          }
        }
      }

      const nextNumber = highestNumber + 1;
      return `DP${year}${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating DP number:', error);
      return `DP${year}001`;
    }
  }, []); // No dependencies needed as it doesn't rely on props or state

  useEffect(() => {
    const initForm = async () => {
      const dpNumber = await generateDPNumber();
      setFormData(prev => ({ ...prev, dpNumber }));
    };
    initForm();
  }, [generateDPNumber]); // Add generateBatchNumber as dependency

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dbInstance = localStorage.getItem('isTestUser') === 'true' ? testDb : db;
      await addDoc(collection(dbInstance, collectionName), {
        ...formData,
        createdAt: new Date().toISOString(),
        isTestData: localStorage.getItem('isTestUser') === 'true'
      });
      
      alert('Manufacturing form submitted successfully!');
      navigate('/manufacturing');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    }
  };

  const handleChange = (componentName, field, value) => {
    if (componentName) {
      setFormData(prev => ({
        ...prev,
        components: {
          ...prev.components,
          [componentName]: {
            ...prev.components[componentName],
            [field]: value
          }
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', color: 'primary.main' }}>
          {formTitle}
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                disabled
                label="DP Number"
                value={formData.dpNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                name="manufacturingDate"
                label="Manufacturing Date"
                InputLabelProps={{ shrink: true }}
                value={formData.manufacturingDate}
                onChange={(e) => handleChange(null, 'manufacturingDate', e.target.value)}
              />
            </Grid>

            {/* Component Fields */}
            {components.map((component) => (
              <Grid item xs={12} key={component.name}>
                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>
                  {component.name}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      required
                      label="Lot Number"
                      value={formData.components[component.name].lotNumber}
                      onChange={(e) => handleChange(component.name, 'lotNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      required
                      label="Item Number"
                      value={formData.components[component.name].itemNumber}
                      onChange={(e) => handleChange(component.name, 'itemNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      required
                      type="date"
                      label="Expiry Date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.components[component.name].expDate}
                      onChange={(e) => handleChange(component.name, 'expDate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      required
                      type="date"
                      label="Release Date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.components[component.name].releaseDate}
                      onChange={(e) => handleChange(component.name, 'releaseDate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      required
                      type="number"
                      label="Quantity"
                      value={formData.components[component.name].quantity}
                      onChange={(e) => handleChange(component.name, 'quantity', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Grid>
            ))}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/manufacturing')}
                  fullWidth
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  Submit Form
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default ManufacturingFormBase;
