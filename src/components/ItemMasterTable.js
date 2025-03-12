import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  InputAdornment
} from '@mui/material';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { testDb } from '../firebase/testConfig';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import SearchIcon from '@mui/icons-material/Search';
// eslint-disable-next-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import { initializeItemMasterData } from '../utils/itemMasterData';
import { importItemMasterData } from '../utils/importItemMasterData';
import * as XLSX from 'xlsx';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { isAdmin, isManager } from '../utils/userRoles';

const ItemMasterTable = () => {
  // Keep navigate for potential future use, with eslint disable comment
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    item_no: '',
    item_name: '',
    UOM: ''
  });

  const [uomOptions] = useState([
    'KG',
    'EA',
    'Cylinder',
    'g',
    'mL',
    'L',
    'Box',
    'Bottle',
    'Carton'
  ]);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [importResults, setImportResults] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [searchTerm, setSearchTerm] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userCanEdit, setUserCanEdit] = useState(false);

  const fetchPermissions = useCallback(async () => {
    try {
      // Check if the user is a test user (they always have edit permissions)
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      
      if (isTestUser) {
        setUserCanEdit(true);
        return;
      }
      
      // Check if the user is an admin
      if (isAdmin()) {
        setUserCanEdit(true);
        return;
      }
      
      // Check if the user is a manager
      const managerStatus = await isManager();
      setUserCanEdit(managerStatus);
    } catch (error) {
      console.error("Error checking permissions:", error);
      setUserCanEdit(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchPermissions();
  }, [fetchPermissions]);

  const fetchItems = async () => {
    try {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const dbInstance = isTestUser ? testDb : db;
      const collectionName = isTestUser ? 'test_item_master' : 'item_master';
      
      const querySnapshot = await getDocs(collection(dbInstance, collectionName));
      
      // Get items and sort by item_no in ascending order
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort items by item_no (numeric sort if possible, otherwise string sort)
      itemsData.sort((a, b) => {
        // Try to convert to numbers for numeric sorting
        const numA = parseInt(a.item_no);
        const numB = parseInt(b.item_no);
        
        // If both are valid numbers, sort numerically
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        
        // Otherwise sort as strings
        return a.item_no.localeCompare(b.item_no);
      });
      
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('Error loading item master data');
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setCurrentItem({ ...item });
      setEditMode(true);
    } else {
      setCurrentItem({ item_no: '', item_name: '', UOM: '' });
      setEditMode(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentItem({ item_no: '', item_name: '', UOM: '' });
    setEditMode(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveItem = async () => {
    try {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      
      // Ensure we're using the correct database and collection
      const dbInstance = isTestUser ? testDb : db;
      const collectionName = isTestUser ? 'test_item_master' : 'item_master';
      
      // Validate input
      if (!currentItem.item_no || !currentItem.item_name || !currentItem.UOM) {
        alert('Please fill all fields');
        return;
      }
      
      // For test users, only allow modifying test_item_master collection
      if (editMode) {
        // Check if item number exists but with a different ID (for updates)
        const duplicateItem = items.find(
          item => item.item_no === currentItem.item_no && item.id !== currentItem.id
        );
        
        if (duplicateItem) {
          alert(`An item with number ${currentItem.item_no} already exists`);
          return;
        }
        
        // Update existing item
        await updateDoc(doc(dbInstance, collectionName, currentItem.id), {
          item_no: currentItem.item_no,
          item_name: currentItem.item_name,
          UOM: currentItem.UOM,
          updatedAt: new Date().toISOString(),
          isTestData: isTestUser // Flag to identify test data
        });
        alert('Item updated successfully');
      } else {
        // Check if item number already exists
        const existingItem = items.find(item => item.item_no === currentItem.item_no);
        if (existingItem) {
          alert(`An item with number ${currentItem.item_no} already exists`);
          return;
        }
        
        // Add new item
        await addDoc(collection(dbInstance, collectionName), {
          item_no: currentItem.item_no,
          item_name: currentItem.item_name,
          UOM: currentItem.UOM,
          createdAt: new Date().toISOString(),
          isTestData: isTestUser, // Flag to identify test data
          active: true
        });
        alert('Item added successfully');
      }
      
      handleCloseDialog();
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      try {
        const isTestUser = localStorage.getItem('isTestUser') === 'true';
        const dbInstance = isTestUser ? testDb : db;
        const collectionName = isTestUser ? 'test_item_master' : 'item_master';
        
        await deleteDoc(doc(dbInstance, collectionName, id));
        alert('Item deleted successfully');
        fetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const bulkUploadItemsInline = async (items) => {
    try {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const dbInstance = isTestUser ? testDb : db;
      const collectionName = isTestUser ? 'test_item_master' : 'item_master';
      
      console.log(`Bulk uploading to ${collectionName} (Test user: ${isTestUser})`);
      
      const results = [];
      
      // Process 5 items at a time to avoid Firestore rate limits
      for (let i = 0; i < items.length; i += 5) {
        const batch = items.slice(i, i + 5);
        
        for (const item of batch) {
          try {
            const docRef = await addDoc(collection(dbInstance, collectionName), {
              ...item,
              isTestData: isTestUser,
              createdAt: new Date().toISOString(),
              active: true
            });
            results.push({ id: docRef.id, status: 'success', item_no: item.item_no });
          } catch (error) {
            results.push({ id: null, status: 'error', item_no: item.item_no, error: error.message });
          }
        }
        
        // Small delay between batches
        if (i + 5 < items.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error in bulk upload:', error);
      throw error;
    }
  };

  const handleImportFromExcel = async () => {
    if (!importFile) {
      showSnackbar('Please select a file first', 'error');
      return;
    }
    
    setImportLoading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Validate data format
          const validData = jsonData.map(row => {
            // Map Excel column names to our data model
            return {
              item_no: row.item_no?.toString() || row.ItemNo?.toString() || row.Item_No?.toString() || '',
              item_name: row.item_name || row.ItemName || row.Item_Name || '',
              UOM: row.UOM || row.Unit || row.uom || ''
            };
          }).filter(item => item.item_no && item.item_name);
          
          if (validData.length === 0) {
            showSnackbar('No valid data found in Excel file', 'error');
            setImportLoading(false);
            return;
          }
          
          // Upload the data using our inline function instead of imported one
          const results = await bulkUploadItemsInline(validData);
          
          // Show results
          setImportResults(results);
          setImportFile(null); // Reset the file input
          setImportDialogOpen(false);
          
          const successCount = results.filter(r => r.status === 'success').length;
          showSnackbar(`Successfully imported ${successCount} items`, 'success');
          
          // Reload items
          fetchItems();
        } catch (error) {
          console.error('Error processing Excel file:', error);
          showSnackbar(`Error processing Excel file: ${error.message}`, 'error');
        } finally {
          setImportLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(importFile);
      
    } catch (error) {
      console.error('File reading error:', error);
      showSnackbar(`File reading error: ${error.message}`, 'error');
      setImportLoading(false);
    }
  };

  const handleInitializeData = async () => {
    try {
      setImportLoading(true);
      await initializeItemMasterData();
      showSnackbar('Successfully initialized item master data', 'success');
      fetchItems();
    } catch (error) {
      showSnackbar(`Error initializing data: ${error.message}`, 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportSampleData = async () => {
    try {
      setImportLoading(true);
      await importItemMasterData();
      showSnackbar('Successfully imported sample data', 'success');
      fetchItems();
    } catch (error) {
      showSnackbar(`Error importing sample data: ${error.message}`, 'error');
    } finally {
      setImportLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          file.type !== 'application/vnd.ms-excel') {
        showSnackbar('Please upload only Excel files (.xlsx or .xls)', 'error');
        e.target.value = '';
        return;
      }
      setImportFile(file);
    }
  };

  const handleCloseImportDialog = () => {
    if (!importLoading) {
      setImportDialogOpen(false);
      // Reset the file input when closing the dialog
      setImportFile(null);
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    return (
      item.item_no.toLowerCase().includes(searchTermLower) ||
      item.item_name.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center',
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            fontSize: isMobile ? '1.75rem' : '2.125rem' 
          }}
        >
          Item Master Data
        </Typography>
        
        {/* Only show these buttons if user has edit permissions */}
        {userCanEdit && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto', 
            gap: isMobile ? 1 : 2 
          }}>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => setImportDialogOpen(true)}
              sx={{ 
                width: isMobile ? '100%' : 'auto' 
              }}
            >
              Import Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{ width: isMobile ? '100%' : 'auto' }}
            >
              Add New Item
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by Item Number or Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          size="medium"
        />
      </Box>

      {isMobile ? (
        // Mobile card view
        <Box>
          {filteredItems.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                {items.length === 0 ? 'No items found' : 'No matching items found'}
              </Typography>
            </Paper>
          ) : (
            filteredItems.map((item) => (
              <Card 
                key={item.id} 
                sx={{ 
                  mb: 2, 
                  boxShadow: 2,
                  '&:hover': { boxShadow: 4 }
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 1, 
                      fontWeight: 'bold',
                      color: 'primary.main' 
                    }}
                  >
                    {item.item_name}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Item Number
                      </Typography>
                      <Typography variant="body1">
                        {item.item_no}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        UOM
                      </Typography>
                      <Typography variant="body1">
                        {item.UOM}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <Divider />
                {userCanEdit && (
                  <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))
          )}
        </Box>
      ) : (
        // Desktop table view (your existing code)
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Item Number</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Item Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>UOM</TableCell>
                {userCanEdit && (
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userCanEdit ? 4 : 3} align="center" sx={{ py: 3 }}>
                    {items.length === 0 ? 'No items found' : 'No matching items found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.item_no}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.UOM}</TableCell>
                    {userCanEdit && (
                      <TableCell>
                        <IconButton 
                          color="primary" 
                          onClick={() => handleOpenDialog(item)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Only render dialogs if user has edit permissions */}
      {userCanEdit && (
        <>
          <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>{editMode ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  name="item_no"
                  label="Item Number"
                  fullWidth
                  value={currentItem.item_no}
                  onChange={handleInputChange}
                  required
                />
                <TextField
                  name="item_name"
                  label="Item Name"
                  fullWidth
                  value={currentItem.item_name}
                  onChange={handleInputChange}
                  required
                />
                <FormControl fullWidth required>
                  <InputLabel>UOM (Unit of Measure)</InputLabel>
                  <Select
                    name="UOM"
                    value={currentItem.UOM}
                    onChange={handleInputChange}
                    label="UOM (Unit of Measure)"
                  >
                    {uomOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveItem}
              >
                {editMode ? 'Update' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Import Dialog */}
          <Dialog open={importDialogOpen} onClose={handleCloseImportDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Import Items from Excel</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography>
                  Upload an Excel file (.xlsx) with item data. The file should have columns for:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2">• item_no (Item Number)</Typography>
                  <Typography variant="body2">• item_name (Item Name)</Typography>
                  <Typography variant="body2">• UOM (Unit of Measure)</Typography>
                </Box>
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ 
                      py: 3,
                      borderStyle: 'dashed',
                      bgcolor: 'background.default'
                    }}
                  >
                    {importFile ? importFile.name : 'Choose Excel File'}
                    <input
                      type="file"
                      hidden
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={importLoading}
                    />
                  </Button>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  Or use one of these options:
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleInitializeData}
                    disabled={importLoading}
                    sx={{ flex: 1 }}
                  >
                    Initialize Default Data
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={handleImportSampleData}
                    disabled={importLoading}
                    sx={{ flex: 1 }}
                  >
                    Import Sample Data
                  </Button>
                </Box>
                
                {importLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={handleCloseImportDialog}
                disabled={importLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleImportFromExcel}
                disabled={!importFile || importLoading}
              >
                {importLoading ? 'Importing...' : 'Import Data'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ItemMasterTable;
