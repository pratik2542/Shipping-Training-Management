import React, { useState, useEffect } from 'react';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TableContainer,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { testDb, testAuth } from '../firebase/testConfig';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { generatePDF } from '../utils/pdfGenerator';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { signOut } from 'firebase/auth';
import DeleteIcon from '@mui/icons-material/Delete';

const Records = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const dbInstance = isTestUser ? testDb : db;
      const collectionName = isTestUser ? 'test_shipments' : 'shipments';
      
      // First, check if collection exists for test users
      if (isTestUser) {
        // For test users, empty records are normal - don't show error
        const querySnapshot = await getDocs(collection(dbInstance, collectionName));
        const recordsData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          docId: doc.id,
          id: doc.data().id
        }));
        setRecords(recordsData);
      } else {
        // For regular users, proceed with normal fetch
        const querySnapshot = await getDocs(collection(dbInstance, collectionName));
        const recordsData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          docId: doc.id,
          id: doc.data().id
        }));
        setRecords(recordsData);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      if (!isTestUser) {
        // Only show error alert for regular users
        alert('Error fetching records');
      }
      // For test users, just set empty records
      setRecords([]);
    }
  };

  const handleEdit = (record) => {
    if (record.approverSign) {
      alert('Cannot edit an approved record');
      return;
    }
    const editId = record.docId;
    console.log('Editing record with ID:', editId);
    if (!editId) {
      alert('Invalid record ID');
      return;
    }
    navigate(`/shipping-form?edit=${editId}`);
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const handleViewPDF = (pdfData) => {
    // Check if the data is base64
    if (pdfData.startsWith('data:application/pdf;base64,')) {
      // Convert base64 to blob
      const base64Response = fetch(pdfData);
      base64Response.then(res => res.blob()).then(blob => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.URL.revokeObjectURL(url);
      });
    } else {
      // If it's already a URL, just open it
      window.open(pdfData, '_blank');
    }
  };

  const handleGeneratePDF = async (record) => {
    try {
      const pdfDoc = await generatePDF(record);
      const pdfBlob = new Blob([pdfDoc], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      window.open(pdfUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const cleanupTestData = async () => {
    try {
      // Get all documents from test_shipments collection
      const querySnapshot = await getDocs(collection(testDb, 'test_shipments'));
      
      // Delete each document
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete test user account
      const user = testAuth.currentUser;
      if (user) {
        await user.delete();
      }
      
      console.log('Test data cleanup completed');
    } catch (error) {
      console.error('Error cleaning up test data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      
      if (isTestUser) {
        // First clean up all test data
        await cleanupTestData();
        // Then sign out
        await signOut(testAuth);
      } else {
        await signOut(auth);
      }
      
      localStorage.removeItem('isTestUser');
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still try to navigate away even if there's an error
      localStorage.removeItem('isTestUser');
      navigate('/');
    }
  };

  const handleDelete = async (record) => {
    if (!isAdmin) return;

    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      try {
        const dbInstance = localStorage.getItem('isTestUser') === 'true' ? testDb : db;
        const collectionName = localStorage.getItem('isTestUser') === 'true' ? 'test_shipments' : 'shipments';
        
        await deleteDoc(doc(dbInstance, collectionName, record.docId));
        // Refresh records list
        fetchRecords();
        alert('Record deleted successfully');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const filteredRecords = records.filter(record => {
    const shipmentCode = record.shipmentCode || ''; // Change from dpNumber to shipmentCode
    const itemName = record.itemName || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    return shipmentCode.toString().toLowerCase().includes(searchTermLower) ||
           itemName.toString().toLowerCase().includes(searchTermLower);
  });

  const renderTableRow = (record) => (
    <TableRow 
      key={record.id || record.docId}
      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
    >
      <TableCell>{record.shipmentCode || 'N/A'}</TableCell> {/* Change from dpNumber to shipmentCode */}
      <TableCell>{record.shipmentDate || 'N/A'}</TableCell>
      <TableCell>{record.itemName || 'N/A'}</TableCell>
      <TableCell>
        <Typography
          sx={{
            color: record.approverSign ? 'success.main' : 
                  record.inspectorSign ? 'info.main' : 
                  record.receiverSign ? 'warning.main' : 'gray',
            fontWeight: 500,
          }}
        >
          {record.approverSign ? 'Approved' : 
           record.inspectorSign ? 'Pending Approval' : 
           record.receiverSign ? 'Pending Inspection' : 'Pending Shipment'}
        </Typography>
      </TableCell>
      <TableCell>
        <IconButton
          color="primary"
          onClick={() => handleEdit(record)}
          disabled={record.approverSign}
          sx={{ mr: 1 }}
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          color="secondary"
          onClick={() => handleView(record)}
          sx={{ mr: 1 }}
        >
          <VisibilityIcon />
        </IconButton>
        <IconButton
          color="primary"
          onClick={() => handleGeneratePDF(record)}
          sx={{ mr: 1 }}
        >
          <PictureAsPdfIcon />
        </IconButton>
        {isAdmin && (
          <IconButton
            color="error"
            onClick={() => handleDelete(record)}
            sx={{ mr: 1 }}
            title="Delete Record"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </TableCell>
    </TableRow>
  );

  const ViewDialog = () => (
    <Dialog 
      open={viewDialogOpen} 
      onClose={() => setViewDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Shipping Record Details - {selectedRecord?.shipmentCode}  {/* Update from dpNumber to shipmentCode */}
      </DialogTitle>
      <DialogContent>
        {selectedRecord && (
          <Table>
            <TableBody>
              {/* Basic Details */}
              <TableRow>
                <TableCell><strong>Shipment Code</strong></TableCell>  {/* Update label */}
                <TableCell>{selectedRecord.shipmentCode}</TableCell>  {/* Update from dpNumber */}
              </TableRow>
              <TableRow>
                <TableCell><strong>Shipment Date</strong></TableCell>
                <TableCell>{selectedRecord.shipmentDate}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Item Number</strong></TableCell>
                <TableCell>{selectedRecord.itemNo}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Item Name</strong></TableCell>
                <TableCell>{selectedRecord.itemName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Lot Number</strong></TableCell>
                <TableCell>{selectedRecord.lotNumber}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Quantities</strong></TableCell>
                <TableCell>{selectedRecord.quantities}</TableCell>
              </TableRow>

              {/* Receiver Details */}
              {selectedRecord.receiverName && (
                <>
                  <TableRow>
                    <TableCell><strong>Receiver Name</strong></TableCell>
                    <TableCell>{selectedRecord.receiverName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Receiver Date</strong></TableCell>
                    <TableCell>{selectedRecord.receiverDate}</TableCell>
                  </TableRow>
                  {selectedRecord.receiverSign && (
                    <TableRow>
                      <TableCell><strong>Receiver Signature</strong></TableCell>
                      <TableCell>
                        <img 
                          src={selectedRecord.receiverSign} 
                          alt="Receiver Signature" 
                          style={{ maxWidth: '200px' }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}

              {/* Inspector Details */}
              {selectedRecord.inspectorName && (
                <>
                  <TableRow>
                    <TableCell><strong>Inspector Name</strong></TableCell>
                    <TableCell>{selectedRecord.inspectorName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Inspector Date</strong></TableCell>
                    <TableCell>{selectedRecord.inspectorDate}</TableCell>
                  </TableRow>
                  {selectedRecord.inspectorSign && (
                    <TableRow>
                      <TableCell><strong>Inspector Signature</strong></TableCell>
                      <TableCell>
                        <img 
                          src={selectedRecord.inspectorSign} 
                          alt="Inspector Signature" 
                          style={{ maxWidth: '200px' }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}

              {/* Approver Details */}
              {selectedRecord.approverName && (
                <>
                  <TableRow>
                    <TableCell><strong>Approver Name</strong></TableCell>
                    <TableCell>{selectedRecord.approverName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Approver Date</strong></TableCell>
                    <TableCell>{selectedRecord.approverDate}</TableCell>
                  </TableRow>
                  {selectedRecord.approverSign && (
                    <TableRow>
                      <TableCell><strong>Approver Signature</strong></TableCell>
                      <TableCell>
                        <img 
                          src={selectedRecord.approverSign} 
                          alt="Approver Signature" 
                          style={{ maxWidth: '200px' }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}

              {/* Attachment */}
              {selectedRecord.attachmentUrl && (
                <TableRow>
                  <TableCell><strong>Attachment</strong></TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewPDF(selectedRecord.attachmentUrl)}
                    >
                      View PDF
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ fontWeight: 600, color: 'primary.main', mt: 2  }}
        >
          Shipping Records
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2, mt: 2  }}
          >
            Home
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ mt: 2 }}
          >
            Logout
          </Button>
        </Box>
      </Box>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by Shipment Code or Item Name"  /* Update placeholder */
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Shipment Code</TableCell>  {/* Update header */}
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Shipment Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Item Name</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecords.map(record => renderTableRow(record))}
          </TableBody>
        </Table>
      </TableContainer>

      <ViewDialog />
    </Container>
  );
};

export default Records;