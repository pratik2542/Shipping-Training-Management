import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Grid,
  Input,
  IconButton,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { testDb, testAuth } from '../firebase/testConfig';
import SignatureDialog from './common/SignatureDialog';
import ClearIcon from '@mui/icons-material/Clear';
import { useNavigate } from 'react-router-dom';

const SelfTrainingForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sopId: '',
    sopNumber: '',
    sopTitle: '',
    revision: '',
    traineeName: '',
    traineeSign: '',
    traineeDate: '',
    attachmentUrl: '',
    attachmentName: '',
  });
  const [sops, setSops] = useState([]);
  const [loadingSops, setLoadingSops] = useState(true);
  const [selectedSopOption, setSelectedSopOption] = useState(null);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  const getDbInstance = () => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    return isTestUser ? testDb : db;
  };

  const getSopCollectionName = () => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    return isTestUser ? 'test_sops' : 'sops';
  };

  const getCollectionName = () => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    return isTestUser ? 'test_selfTrainings' : 'selfTrainings';
  };

  useEffect(() => {
    const fetchSops = async () => {
      setLoadingSops(true);
      try {
        const dbInstance = getDbInstance();
        const collectionName = getSopCollectionName();
        const q = query(collection(dbInstance, collectionName), orderBy('sopNumber'));
        const querySnapshot = await getDocs(q);
        const sopsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSops(sopsData);
      } catch (error) {
        console.error('Error fetching SOPs:', error);
      } finally {
        setLoadingSops(false);
      }
    };

    fetchSops();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const user = isTestUser ? testAuth.currentUser : auth.currentUser;
      if (user) {
        setUserId(user.uid);
        const storedName = localStorage.getItem('userName');
        if (storedName) {
          setFormData(prev => ({ ...prev, traineeName: storedName }));
        } else {
          const nameFromEmail = user.email.split('@')[0];
          setFormData(prev => ({ ...prev, traineeName: nameFromEmail }));
        }
      } else {
        console.error("User not logged in for self training form.");
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSopChange = (event, newValue) => {
    setSelectedSopOption(newValue);
    if (newValue) {
      setFormData(prev => ({
        ...prev,
        sopId: newValue.id,
        sopNumber: newValue.sopNumber,
        sopTitle: newValue.title,
        revision: newValue.revision
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        sopId: '',
        sopNumber: '',
        sopTitle: '',
        revision: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          attachmentUrl: reader.result,
          attachmentName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureClick = () => {
    setSignatureDialogOpen(true);
  };

  const handleSignatureSave = (signature) => {
    const currentDate = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      traineeSign: signature,
      traineeDate: currentDate
    }));
    setSignatureDialogOpen(false);
  };

  const handleRemoveSignature = () => {
    setFormData(prev => ({
      ...prev,
      traineeSign: '',
      traineeDate: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sopNumber || !formData.revision || !formData.traineeSign) {
      alert('Please select an SOP, ensure Revision is filled, and provide your signature.');
      return;
    }
    if (!userId) {
      alert('User information not loaded. Please try again.');
      return;
    }
    setIsSubmitting(true);

    try {
      const dbInstance = getDbInstance();
      const collectionName = getCollectionName();

      let nextId = 1;
      const q = query(
        collection(dbInstance, collectionName),
        orderBy('numericId', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[0].data();
        nextId = (parseInt(lastDoc.numericId) || 0) + 1;
      }

      const dataToSubmit = {
        ...formData,
        userId: userId,
        id: nextId.toString(),
        numericId: nextId,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        isTestData: localStorage.getItem('isTestUser') === 'true'
      };

      await addDoc(collection(dbInstance, collectionName), dataToSubmit);

      alert('Self Training record submitted successfully!');
      navigate('/training/records');

    } catch (error) {
      console.error('Error submitting self training form:', error);
      alert(`Error submitting form: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center', color: 'primary.main' }}>
          Submit Self Training Record
        </Typography>
        <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                id="sop-select"
                options={sops}
                loading={loadingSops}
                getOptionLabel={(option) => `${option.sopNumber} - ${option.title}`}
                value={selectedSopOption}
                onChange={handleSopChange}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select SOP"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingSops ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="revision"
                label="Revision"
                value={formData.revision}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="traineeName"
                label="Trainee Name"
                value={formData.traineeName}
                fullWidth
                disabled
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="traineeDate"
                label="Date Signed"
                value={formData.traineeDate}
                fullWidth
                disabled
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Trainee Signature *</Typography>
              {formData.traineeSign ? (
                <Box>
                  <Box sx={{ border: '1px solid #ccc', p: 1, mb: 1, display: 'inline-block' }}>
                    <img
                      src={formData.traineeSign}
                      alt="Trainee Signature"
                      style={{ display: 'block', maxWidth: '300px', height: 'auto' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" size="small" onClick={handleSignatureClick}>
                      Change Signature
                    </Button>
                    <Button variant="outlined" size="small" color="error" onClick={handleRemoveSignature}>
                      Remove Signature
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button variant="outlined" onClick={handleSignatureClick}>
                  Add Signature
                </Button>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachment (Optional)</Typography>
              <Input
                type="file"
                onChange={handleFileChange}
                fullWidth
              />
              {formData.attachmentName && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Selected: {formData.attachmentName}
                  <IconButton size="small" onClick={() => setFormData(prev => ({ ...prev, attachmentUrl: '', attachmentName: '' }))}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isSubmitting || !formData.traineeSign || !formData.sopNumber || !formData.revision}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Training'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <SignatureDialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        onSave={handleSignatureSave}
        title="Trainee Signature"
      />
    </Container>
  );
};

export default SelfTrainingForm;
