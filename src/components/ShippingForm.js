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
import { MenuItem, FormControl, InputLabel, Select, FormControlLabel, Checkbox, IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

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
    attachmentName: '',     // This will store the file name
    qualifiedManufacturer: '',
    landingBillNumber: '',
    remainingQuantity: 0,
    unit: '',
    expiryDate: null,
    damageToPackaging: false,
    damageToProduct: false,
    totalQuantityAccepted: 0,
    damageNotes: '',
    vendor: '', // Add new vendor field
    transportation: '', // Add new transportation field
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
              attachmentName: data.attachmentName || '',
              qualifiedManufacturer: data.qualifiedManufacturer || '',
              landingBillNumber: data.landingBillNumber || '',
              remainingQuantity: data.remainingQuantity || 0,
              unit: data.unit || '',
              expiryDate: data.expiryDate || null,
              damageToPackaging: data.damageToPackaging || false,
              damageToProduct: data.damageToProduct || false,
              totalQuantityAccepted: data.totalQuantityAccepted || 0,
              damageNotes: data.damageNotes || '',
              vendor: data.vendor || '', // Add new vendor field
              transportation: data.transportation || '', // Add new transportation field
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
            attachmentName: '',
            qualifiedManufacturer: '',
            landingBillNumber: '',
            remainingQuantity: 0,
            unit: '',
            expiryDate: null,
            damageToPackaging: false,
            damageToProduct: false,
            totalQuantityAccepted: 0,
            damageNotes: '',
            vendor: '', // Add new vendor field
            transportation: '', // Add new transportation field
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

      // Only generate new ID for new records, not for edits
      let dataToSubmit = {
        ...formData,
        lastUpdated: new Date().toISOString(),
        isTestData: isTestUser
      };

      if (!isEditMode) {
        // Generate new ID only for new records
        let nextId = 1;
        if (!isTestUser) {
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
        }

        // Add new ID fields only for new records
        dataToSubmit = {
          ...dataToSubmit,
          id: nextId.toString(),
          numericId: nextId,
          uniqueId: `${nextId}-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
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

      dataToSubmit = {
        ...dataToSubmit,
        status: status
      };

      // Save to database
      if (isEditMode && recordId) {
        await updateDoc(doc(dbInstance, collectionName, recordId), dataToSubmit);
      } else {
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: newValue
      };

      // Auto-calculate remaining quantity
      if (name === 'quantities') {
        updatedData.remainingQuantity = Number(value);
        updatedData.totalQuantityAccepted = Number(value);
      }

      // Generate shipment code if all required fields are present
      if (['itemNo', 'lotNumber', 'shipmentDate'].includes(name)) {
        const shipmentCode = generateShipmentCode(
          name === 'itemNo' ? value : updatedData.itemNo,
          name === 'lotNumber' ? value : updatedData.lotNumber,
          name === 'shipmentDate' ? value : updatedData.shipmentDate
        );
        updatedData.shipmentCode = shipmentCode;
      }
      
      return updatedData;
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

  // Add this function after handleSignatureSave
  const handleRemoveSignature = (signatureField) => {
    // Get corresponding date field
    const dateField = signatureField.replace('Sign', 'Date');
    
    // Clear both signature and date
    setFormData(prev => ({
      ...prev,
      [signatureField]: '',
      [dateField]: ''
    }));
  };

  const canModifyField = (fieldName) => {
     if (!isEditMode) {
      return fieldName.startsWith('receiver');
    }

    const status = recordFromDatabase?.status || 'Pending Shipment';

    switch (status) {
      case 'Pending Shipment':
        return fieldName.startsWith('receiver');
        
      case 'Pending Inspection':
        // Only inspector fields are editable, receiver fields are read-only
        return fieldName.startsWith('inspector');
        
      case 'Pending Approval':
        // Only approver fields are editable, others are read-only
        return fieldName.startsWith('approver');
        
      case 'Approved':
        // Nothing is editable
        return false;
        
      default:
        return false;
    }
  };

  const [manufacturers, setManufacturers] = useState([
    'UPS',
    'Amazon',
    'Purolator',
    'Canada Post',
    'FedEx',
    'DHL'
  ]);
  const [newManufacturer, setNewManufacturer] = useState('');
  const [showAddManufacturer, setShowAddManufacturer] = useState(false);

  const handleAddManufacturer = () => {
    if (newManufacturer.trim() !== '' && !manufacturers.includes(newManufacturer.trim())) {
      setManufacturers(prev => [...prev, newManufacturer.trim()]);
      setFormData(prev => ({...prev, qualifiedManufacturer: newManufacturer.trim()}));
      setNewManufacturer('');
      setShowAddManufacturer(false);
    }
  };

  const unitOptions = [
    'KG',
    'EA',
    'Cylinder'
  ];

  // Add vendor options array with the new values
  const [vendorOptions, setVendorOptions] = useState([
    'Zomato',
    'Swiggy',
    'BlinkIt',
    'Zepto'
  ]);
  const [newVendor, setNewVendor] = useState('');
  const [showAddVendor, setShowAddVendor] = useState(false);

  // Add this function near handleAddManufacturer
  const handleAddVendor = () => {
    if (newVendor.trim() !== '' && !vendorOptions.includes(newVendor.trim())) {
      setVendorOptions(prev => [...prev, newVendor.trim()]);
      setFormData(prev => ({...prev, vendor: newVendor.trim()}));
      setNewVendor('');
      setShowAddVendor(false);
    }
  };

  // Add new function to determine which sections to show
  const shouldShowSection = (section) => {
    // New form - only show receiver
    if (!isEditMode) {
      return section === 'receiver';
    }

    // Get current status from database record
    const status = recordFromDatabase?.status || 'Pending Shipment';

    // Show sections based on workflow progress
    switch (status) {
      case 'Pending Shipment':
        return section === 'receiver';
        
      case 'Pending Inspection':
        // Show both receiver (read-only) and inspector
        return section === 'receiver' || section === 'inspector';
        
      case 'Pending Approval':
        // Show all sections - receiver and inspector read-only, approver editable
        return section === 'receiver' || section === 'inspector' || section === 'approver';
        
      case 'Approved':
        // Show all sections as read-only
        return section === 'receiver' || section === 'inspector' || section === 'approver';
        
      default:
        return section === 'receiver';
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

            {/* New Fields */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Qualified Manufacturer</InputLabel>
                <Select
                  name="qualifiedManufacturer"
                  value={formData.qualifiedManufacturer}
                  onChange={handleChange}
                  label="Qualified Manufacturer"
                  required
                  endAdornment={
                    formData.qualifiedManufacturer && (
                      <IconButton 
                        size="small" 
                        sx={{ mr: 4 }}
                        onClick={() => setFormData(prev => ({ ...prev, qualifiedManufacturer: '' }))}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  {manufacturers.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                  <MenuItem divider />
                  <MenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowAddManufacturer(true);
                    }}
                    sx={{
                      color: 'primary.main',
                      fontWeight: 'medium',
                    }}
                  >
                    + Add Custom Manufacturer
                  </MenuItem>
                </Select>
              </FormControl>
              
              {/* Add custom manufacturer input */}
              {showAddManufacturer && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="New Manufacturer"
                    value={newManufacturer}
                    onChange={(e) => setNewManufacturer(e.target.value)}
                    placeholder="Enter manufacturer name"
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleAddManufacturer}
                    sx={{ minWidth: '80px' }}
                  >
                    Add
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setShowAddManufacturer(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Vendor</InputLabel>
                <Select
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  label="Vendor"
                  required
                  endAdornment={
                    formData.vendor && (
                      <IconButton 
                        size="small" 
                        sx={{ mr: 4 }}
                        onClick={() => setFormData(prev => ({ ...prev, vendor: '' }))}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  {vendorOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                  <MenuItem divider />
                  <MenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowAddVendor(true);
                    }}
                    sx={{
                      color: 'primary.main',
                      fontWeight: 'medium',
                    }}
                  >
                    + Add Custom Vendor
                  </MenuItem>
                </Select>
              </FormControl>
              
              {/* Add custom vendor input */}
              {showAddVendor && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="New Vendor"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    placeholder="Enter vendor name"
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleAddVendor}
                    sx={{ minWidth: '80px' }}
                  >
                    Add
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={() => setShowAddVendor(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Grid>

            {/* Add transportation field after vendor field */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Transportation"
                name="transportation"
                value={formData.transportation}
                onChange={handleChange}
                required
                placeholder="Enter transportation details"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Landing Bill Number"
                name="landingBillNumber"
                value={formData.landingBillNumber}
                onChange={handleChange}
                required
              />
            </Grid>

            {/* Quantity Fields Row */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Remaining Quantity"
                value={formData.remainingQuantity}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  readOnly: true,
                }}
                disabled
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  name="unit"
                  value={formData.unit}
                  label="Unit"
                  onChange={handleChange}
                  required
                  endAdornment={
                    formData.unit && (
                      <IconButton 
                        size="small" 
                        sx={{ mr: 4 }}
                        onClick={() => setFormData(prev => ({ ...prev, unit: '' }))}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )
                  }
                >
                  {unitOptions.map(option => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                name="expiryDate"
                label="Expiry Date"
                InputLabelProps={{ shrink: true }}
                value={formData.expiryDate || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  expiryDate: e.target.value
                }))}
                sx={{ width: '100%' }}  // Ensure full width
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Quantity Accepted"
                name="totalQuantityAccepted"
                type="number"
                value={formData.totalQuantityAccepted}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.damageToPackaging}
                    onChange={handleChange}
                    name="damageToPackaging"
                  />
                }
                label="Damage to Packaging"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.damageToProduct}
                    onChange={handleChange}
                    name="damageToProduct"
                  />
                }
                label="Damage to Product"
              />
            </Grid>

            {(formData.damageToPackaging || formData.damageToProduct) && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Damage Notes"
                  name="damageNotes"
                  value={formData.damageNotes}
                  onChange={handleChange}
                  required
                />
              </Grid>
            )}

            {/* Receiver Details */}
            {shouldShowSection('receiver') && (
              <>
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
                      <>
                        <Box sx={{ border: '1px solid #ccc', p: 1, mb: 1 }}>
                          <img 
                            src={formData.receiverSign} 
                            alt="Receiver Signature" 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Box>
                        {canModifyField('receiverSign') && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile
                            gap: 1
                          }}>
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => handleSignatureClick('receiverSign')}
                              sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Smaller font on mobile
                                py: 1 // Consistent padding
                              }}
                            >
                              Change
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              fullWidth
                              onClick={() => handleRemoveSignature('receiverSign')}
                              sx={{ py: 1 }} // Consistent padding
                            >
                              Remove
                            </Button>
                          </Box>
                        )}
                      </>
                    ) : (
                      canModifyField('receiverSign') && (
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleSignatureClick('receiverSign')}
                        >
                          Add Signature
                        </Button>
                      )
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
              </>
            )}

            {/* Inspector Details */}
            {shouldShowSection('inspector') && (
              <>
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
                      <>
                        <Box sx={{ border: '1px solid #ccc', p: 1, mb: 1 }}>
                          <img 
                            src={formData.inspectorSign} 
                            alt="Inspector Signature" 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Box>
                        {canModifyField('inspectorSign') && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile
                            gap: 1
                          }}>
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => handleSignatureClick('inspectorSign')}
                              sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Smaller font on mobile
                                py: 1 // Consistent padding
                              }}
                            >
                              Change
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              fullWidth
                              onClick={() => handleRemoveSignature('inspectorSign')}
                              sx={{ py: 1 }} // Consistent padding
                            >
                              Remove
                            </Button>
                          </Box>
                        )}
                      </>
                    ) : (
                      canModifyField('inspectorSign') && (
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleSignatureClick('inspectorSign')}
                        >
                          Add Signature
                        </Button>
                      )
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
              </>
            )}

            {/* Approver Details */}
            {shouldShowSection('approver') && (
              <>
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
                      <>
                        <Box sx={{ border: '1px solid #ccc', p: 1, mb: 1 }}>
                          <img 
                            src={formData.approverSign} 
                            alt="Approver Signature" 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Box>
                        {canModifyField('approverSign') && (
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'column', sm: 'row' }, // Stack vertically on mobile
                            gap: 1
                          }}>
                            <Button
                              variant="outlined"
                              fullWidth
                              onClick={() => handleSignatureClick('approverSign')}
                              sx={{ 
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }, // Smaller font on mobile
                                py: 1 // Consistent padding
                              }}
                            >
                              Change
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              fullWidth
                              onClick={() => handleRemoveSignature('approverSign')}
                              sx={{ py: 1 }} // Consistent padding
                            >
                              Remove
                            </Button>
                          </Box>
                        )}
                      </>
                    ) : (
                      canModifyField('approverSign') && (
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => handleSignatureClick('approverSign')}
                        >
                          Add Signature
                        </Button>
                      )
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
              </>
            )}

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