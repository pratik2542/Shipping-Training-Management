import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  Input,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { collection, addDoc, doc, getDoc, updateDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { testDb } from '../firebase/testConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import SignaturePad from 'react-signature-canvas';
//import { generatePDF } from '../utils/pdfGenerator';

const SignatureDialog = ({ open, onClose, onSave, title }) => {
  const sigPadRef = useRef(null);

  const handleSave = () => {
    if (sigPadRef.current) {
      const signatureData = sigPadRef.current.toDataURL();
      onSave(signatureData);
      onClose();
    }
  };

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: '1px solid #ccc',
            borderRadius: 1,
            mt: 2,
            backgroundColor: '#fff',
          }}
        >
          <SignaturePad
            ref={sigPadRef}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'signature-canvas'
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear} color="secondary">
          Clear
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Signature
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ShippingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [formData, setFormData] = useState({
    shipmentCode: '',  // Replace dpNumber with shipmentCode
    shipmentDate: '',
    itemNo: '',
    itemName: '',
    lotNumber: '',
    quantities: '',
    receiverName: '',
    receiverSign: '',
    receiverDate: '',
    inspectorName: '',
    inspectorSign: '',
    inspectorDate: '',
    approverName: '',
    approverSign: '',
    approverDate: '',
    attachmentUrl: '',     // This will store base64 string
    attachmentName: ''     // This will store the file name
  });
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState('');
  const [recordFromDatabase, setRecordFromDatabase] = useState(null);

  const getDbInstance = () => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    return isTestUser ? testDb : db;
  };

  const getCollectionName = () => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    return isTestUser ? 'test_shipments' : 'shipments';
  };

  const generateShipmentCode = useCallback((itemNo, lotNumber, shipmentDate) => {
    if (!itemNo || !lotNumber || !shipmentDate) return '';
    
    // Remove any spaces and special characters
    const cleanItemNo = itemNo.replace(/[^a-zA-Z0-9]/g, '');
    const cleanLotNo = lotNumber.replace(/[^a-zA-Z0-9]/g, '');
    const dateStr = shipmentDate.replace(/-/g, '');

    // Combine the values (using first 4 chars of each if available)
    const code = `${cleanItemNo.slice(0, 4)}-${cleanLotNo.slice(0, 4)}-${dateStr}`;
    return code.toUpperCase();
  }, []);

  const handleBack = () => {
    try {
      navigate('/records');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = '/records';
    }
  };

  useEffect(() => {
    const loadExistingRecord = async () => {
      try {
        const dbInstance = getDbInstance();
        const collectionName = getCollectionName();
        const searchParams = new URLSearchParams(location.search);
        const editId = searchParams.get('edit'); // This is the document ID
        
        if (editId) {
          console.log('Loading record with ID:', editId);
          const docRef = doc(dbInstance, collectionName, editId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('Loaded record data:', data);
            
            setIsEditMode(true);
            setRecordId(editId);
            setFormData({
              id: data.id || '', // This is our auto-generated numeric ID
              shipmentCode: data.shipmentCode || '', // Update this line
              shipmentDate: data.shipmentDate || '',
              itemNo: data.itemNo || '',
              itemName: data.itemName || '',
              lotNumber: data.lotNumber || '',
              quantities: data.quantities || '',
              receiverName: data.receiverName || '',
              receiverSign: data.receiverSign || '',
              receiverDate: data.receiverDate || '',
              inspectorName: data.inspectorName || '',
              inspectorSign: data.inspectorSign || '',
              inspectorDate: data.inspectorDate || '',
              approverName: data.approverName || '',
              approverSign: data.approverSign || '',
              approverDate: data.approverDate || '',
              attachmentUrl: data.attachmentUrl || '',
              attachmentName: data.attachmentName || ''
            });
            setRecordFromDatabase(data);
          } else {
            console.error('No document found with ID:', editId);
            alert('Record not found');
            navigate('/records');
          }
        } else {
          // New form - don't set any ID
          setIsEditMode(false);
          setRecordId(null);
          setFormData({
            shipmentCode: '',
            shipmentDate: '',
            itemNo: '',
            itemName: '',
            lotNumber: '',
            quantities: '',
            receiverName: '',
            receiverSign: '',
            receiverDate: '',
            inspectorName: '',
            inspectorSign: '',
            inspectorDate: '',
            approverName: '',
            approverSign: '',
            approverDate: '',
            attachmentUrl: '',
            attachmentName: ''
          });
        }
      } catch (error) {
        console.error('Error loading record:', error);
        alert('Error loading record');
        navigate('/records');
      }
    };

    loadExistingRecord();
  }, [location.search, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const dbInstance = isTestUser ? testDb : db;
      const collectionName = isTestUser ? 'test_shipments' : 'shipments';

      // Generate ID only when submitting and only from main collection for non-test users
      let nextId = 1;
      if (!isTestUser) {
        // For regular users, query only the main shipments collection
        const q = query(
          collection(db, 'shipments'),
          orderBy('numericId', 'desc'),
          limit(1)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const lastDoc = querySnapshot.docs[0].data();
          nextId = (parseInt(lastDoc.numericId) || 0) + 1;
        }
      } else {
        // For test users, start from 1 each time
        nextId = 1;
      }

      // Validate required fields based on the stage
      let requiredFields = ['shipmentDate', 'itemNo', 'itemName', 'lotNumber', 'quantities'];
      
      if (!isEditMode || !formData.receiverSign) {
        requiredFields = [...requiredFields, 'receiverName'];
      } else if (canModifyField('inspectorName')) {
        requiredFields = [...requiredFields, 'inspectorName'];
      } else if (canModifyField('approverName')) {
        requiredFields = [...requiredFields, 'approverName'];
      }
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Set status based on signature state
      const status = formData.approverSign ? 'Approved' : 
                    formData.inspectorSign ? 'Pending Approval' : 
                    formData.receiverSign ? 'Pending Inspection' : 
                    'Pending Shipment';

      const dataToSubmit = {
        ...formData,
        id: nextId.toString(),
        numericId: nextId,
        uniqueId: `${nextId}-${Date.now()}`,
        shipmentCode: formData.shipmentCode,
        status: status,
        lastUpdated: new Date().toISOString(),
        isTestData: isTestUser // Add flag to identify test data
      };

      // Save to database
      if (isEditMode && recordId) {
        await updateDoc(doc(dbInstance, collectionName, recordId), dataToSubmit);
      } else {
        dataToSubmit.createdAt = new Date().toISOString();
        await addDoc(collection(dbInstance, collectionName), dataToSubmit);
      }

      alert(`Form ${isEditMode ? 'updated' : 'submitted'} successfully!`);
      navigate('/records');
      
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Error submitting form: ${errorMessage}. Please try again.`);
    }
  };
/*
  // Add new function to handle PDF generation
  const handleGeneratePDF = async () => {
    try {
      const pdfDoc = await generatePDF(formData);
      const pdfBlob = new Blob([pdfDoc], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      window.open(pdfUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };*/

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Generate shipment code if all required fields are present
      if (['itemNo', 'lotNumber', 'shipmentDate'].includes(name)) {
        const shipmentCode = generateShipmentCode(
          name === 'itemNo' ? value : newData.itemNo,
          name === 'lotNumber' ? value : newData.lotNumber,
          name === 'shipmentDate' ? value : newData.shipmentDate
        );
        newData.shipmentCode = shipmentCode;
      }
      
      return newData;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload only PDF files');
        e.target.value = '';
        return;
      }
      if (file.size > 1024 * 1024) {  // 1MB limit
        alert('File size should be less than 1MB');
        e.target.value = '';
        return;
      }

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

  const handleSignatureClick = (fieldName) => {
    setCurrentSignatureField(fieldName);
    setSignatureDialogOpen(true);
  };

  const handleSignatureSave = (signature) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const dateField = currentSignatureField.replace('Sign', 'Date');
    
    setFormData(prev => ({
      ...prev,
      [currentSignatureField]: signature,
      [dateField]: currentDate
    }));
    
    setSignatureDialogOpen(false);
    setCurrentSignatureField(null);
  };


  const canModifyField = (fieldName) => {
    // For new forms
    if (!isEditMode) {
      return fieldName.startsWith('receiver');
    }
  
    // Get database status
    const currentStatus = recordFromDatabase?.status || 'Pending Shipment';
  
    // Permission logic based on database status only
    switch (currentStatus) {
      case 'Pending Shipment':
        return fieldName.startsWith('receiver');
        
      case 'Pending Inspection':
        return fieldName.startsWith('inspector');
        
      case 'Pending Approval':
        return fieldName.startsWith('approver');
        
      case 'Approved':
        return false;
        
      default:
        return false;
    }
  };


  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' }, 
          gap: 2,
          mb: 4 
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 2,
            width: { xs: '100%', sm: 'auto' } 
          }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleBack}
            >
              Back to Records
            </Button>
          </Box>
          <Typography 
            variant="h4" 
            sx={{ 
              textAlign: { xs: 'center', sm: 'right' },
              color: 'primary.main',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {isEditMode ? 'Edit Shipping Form' : 'New Shipping Form'}
          </Typography>
        </Box>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Only show ID field if editing or after submission */}
            {(isEditMode || formData.id) && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  disabled
                  label="ID"
                  value={formData.id || ''}
                />
              </Grid>
            )}

            {/* Shipment Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                disabled
                label="Shipment Code"
                value={formData.shipmentCode || ''}
                helperText="Auto-generated from Item No, Lot No, and Date"
              />
            </Grid>

            {/* Shipment Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                name="shipmentDate"
                label="Shipment Date"
                InputLabelProps={{ shrink: true }}
                value={formData.shipmentDate}
                onChange={handleChange}
              />
            </Grid>

            {/* Item Details */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="itemNo"
                label="Item Number"
                value={formData.itemNo}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="itemName"
                label="Item Name"
                value={formData.itemName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="lotNumber"
                label="Lot Number"
                value={formData.lotNumber}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                name="quantities"
                label="Quantities"
                type="number"
                value={formData.quantities}
                onChange={handleChange}
              />
            </Grid>

            {/* Receiver Details */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Receiver Details</Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="receiverName"
                label="Receiver Name"
                value={formData.receiverName}
                onChange={handleChange}
                disabled={!canModifyField('receiverName')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
            <Box sx={{ width: '100%', mt: -3 }}>
                <Typography variant="subtitle2" sx={{ marginBottom: '3px !important' }}>Receiver Signature</Typography>
                {formData.receiverSign ? (
                  <Box sx={{ border: '1px solid #ccc', p: 1, mb: 1 }}>
                    <img 
                      src={formData.receiverSign} 
                      alt="Receiver Signature" 
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </Box>
                ) : null}
                {canModifyField('receiverSign') && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleSignatureClick('receiverSign')}
                  >
                    {formData.receiverSign ? 'Change Signature' : 'Add Signature'}
                  </Button>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
            <TextField
                fullWidth
                type="date"
                name="receiverDate"
                label="Receiver Date"
                InputLabelProps={{ shrink: true }}
                value={formData.receiverDate}
                InputProps={{ readOnly: true }}
            />
            </Grid>

            {/* Inspector Details */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Inspector Details</Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="inspectorName"
                label="Inspector Name"
                value={formData.inspectorName}
                onChange={handleChange}
                disabled={!canModifyField('inspectorName')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
            <Box sx={{ width: '100%', mt: -3 }}>
                <Typography variant="subtitle2" sx={{ marginBottom: '3px !important' }}>Inspector Signature</Typography>
                {formData.inspectorSign ? (
                  <Box sx={{ border: '1px solid #ccc', p: 1, mb: 1 }}>
                    <img 
                      src={formData.inspectorSign} 
                      alt="Inspector Signature" 
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </Box>
                ) : null}
                {canModifyField('inspectorSign') && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleSignatureClick('inspectorSign')}
                  >
                    {formData.inspectorSign ? 'Change Signature' : 'Add Signature'}
                  </Button>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                name="inspectorDate"
                label="Inspector Date"
                InputLabelProps={{ shrink: true }}
                value={formData.inspectorDate}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Approver Details */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>Approver Details</Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                name="approverName"
                label="Approver Name"
                value={formData.approverName}
                onChange={handleChange}
                disabled={!canModifyField('approverName')}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
            <Box sx={{ width: '100%', mt: -3 }}>    
                <Typography variant="subtitle2" sx={{ marginBottom: '3px !important' }}>Approver Signature</Typography>
                {formData.approverSign ? (
                  <Box sx={{ border: '1px solid #ccc', p: 1, mb: 1 }}>
                    <img 
                      src={formData.approverSign} 
                      alt="Approver Signature" 
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </Box>
                ) : null}
                {canModifyField('approverSign') && (
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleSignatureClick('approverSign')}
                  >
                    {formData.approverSign ? 'Change Signature' : 'Add Signature'}
                  </Button>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                name="approverDate"
                label="Approver Date"
                InputLabelProps={{ shrink: true }}
                value={formData.approverDate}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Attachment */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                Attachment (Optional - Max 1MB)
              </Typography>
              <Input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                sx={{ mb: 2 }}
              />
              {formData.attachmentUrl && (
                <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                  Current attachment: {formData.attachmentName || 'PDF Document'}
                </Typography>
              )}
            </Grid>

            {/* Signature Dialog */}
            <SignatureDialog
              open={signatureDialogOpen}
              onClose={() => setSignatureDialogOpen(false)}
              onSave={handleSignatureSave}
              title={`Add ${currentSignatureField?.replace('Sign', '')} Signature`}
            />

            {/* Submit */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
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

export default ShippingForm;