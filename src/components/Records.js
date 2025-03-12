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
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { testDb } from '../firebase/testConfig';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme, useMediaQuery } from '@mui/material';
import { generatePDF } from '../utils/pdfGenerator';

const Records = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const dbInstance = isTestUser ? testDb : db;
      const collectionName = isTestUser ? 'test_shipments' : 'shipments';
      
      // Update query to order by numericId in descending order
      const q = query(
        collection(dbInstance, collectionName),
        orderBy('numericId', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const recordsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        docId: doc.id,
        id: doc.data().id
      }));
      setRecords(recordsData);
    } catch (error) {
      console.error('Error fetching records:', error);
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
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const filteredRecords = records.filter(record => {
    const shipmentCode = record.shipmentCode || '';
    const itemName = record.itemName || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    return shipmentCode.toString().toLowerCase().includes(searchTermLower) ||
           itemName.toString().toLowerCase().includes(searchTermLower);
  });

  // Mobile-optimized table row component
  const renderMobileCard = (record) => (
    <Paper
      key={record.id || record.docId}
      elevation={2}
      sx={{ 
        p: 2, 
        mb: 2,
        border: '1px solid #e0e0e0',
        position: 'relative'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            {record.itemName || 'No Name'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ID: <strong>{record.id}</strong> | Code: <strong>{record.shipmentCode || 'N/A'}</strong>
          </Typography>
          <Typography variant="body2">
            Date: <strong>{record.shipmentDate || 'N/A'}</strong>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: record.approverSign ? 'success.main' : 
                    record.inspectorSign ? 'info.main' : 
                    record.receiverSign ? 'warning.main' : 'gray',
              fontWeight: 600,
              mt: 1
            }}
          >
            Status: {record.approverSign ? 'Approved' : 
                    record.inspectorSign ? 'Pending Approval' : 
                    record.receiverSign ? 'Pending Inspection' : 'Pending Shipment'}
          </Typography>
        </Box>
      </Box>
      
      {/* Mobile actions footer */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-evenly', 
        mt: 2,
        pt: 2,
        borderTop: '1px solid #eaeaea'
      }}>
        <Button
          startIcon={<EditIcon />}
          onClick={() => handleEdit(record)}
          disabled={record.approverSign}
          size="small"
          sx={{ flex: 1, mr: 1 }}
        >
          Edit
        </Button>
        <Button 
          startIcon={<VisibilityIcon />}
          onClick={() => handleView(record)}
          size="small"
          sx={{ flex: 1, mr: 1 }}
        >
          View
        </Button>
        <Button
          startIcon={<PictureAsPdfIcon />}
          onClick={() => handleGeneratePDF(record)}
          size="small"
          sx={{ flex: 1 }}
        >
          PDF
        </Button>
        {isAdmin && (
          <Button
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDelete(record)}
            size="small"
            sx={{ flex: 1, ml: 1 }}
          >
            Delete
          </Button>
        )}
      </Box>
    </Paper>
  );

  const renderTableRow = (record) => (
    <TableRow 
      key={record.id || record.docId}
      sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
    >
      <TableCell>{record.id}</TableCell>
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
      // Make dialog full screen on mobile
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        pr: isMobile ? 6 : 'inherit',
        fontSize: isMobile ? '1.2rem' : 'inherit',
        wordBreak: 'break-word'
      }}>
        {isMobile ? 'Shipment Details' : `Shipping Record Details - ${selectedRecord?.shipmentCode}`}
      </DialogTitle>
      <DialogContent>
        {selectedRecord && (
          isMobile ? (
            // Enhanced mobile-optimized detail view
            <Box sx={{ mt: 2 }}>
              {/* Basic Information Section */}
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">ID</Typography>
                  <Typography variant="body1">{selectedRecord.id}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Shipment Code</Typography>
                  <Typography variant="body1">{selectedRecord.shipmentCode}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Shipment Date</Typography>
                  <Typography variant="body1">{selectedRecord.shipmentDate}</Typography>
                </Box>
              </Paper>
              
              {/* Item Details */}
              <Typography variant="h6" gutterBottom>Item Details</Typography>
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Item Number</Typography>
                  <Typography variant="body1">{selectedRecord.itemNo}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Item Name</Typography>
                  <Typography variant="body1">{selectedRecord.itemName}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Lot Number</Typography>
                  <Typography variant="body1">{selectedRecord.lotNumber}</Typography>
                </Box>
              </Paper>
              
              {/* Quantity Information */}
              <Typography variant="h6" gutterBottom>Quantity Information</Typography>
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Quantities</Typography>
                  <Typography variant="body1">{selectedRecord.quantities}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Remaining Quantity</Typography>
                  <Typography variant="body1">{selectedRecord.remainingQuantity}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Unit</Typography>
                  <Typography variant="body1">{selectedRecord.unit}</Typography>
                </Box>
              </Paper>
              
              {/* Additional Details */}
              <Typography variant="h6" gutterBottom>Additional Details</Typography>
              <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Qualified Manufacturer</Typography>
                  <Typography variant="body1">{selectedRecord.qualifiedManufacturer || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Vendor</Typography>
                  <Typography variant="body1">{selectedRecord.vendor || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Transportation</Typography>
                  <Typography variant="body1">{selectedRecord.transportation || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Landing Bill Number</Typography>
                  <Typography variant="body1">{selectedRecord.landingBillNumber || 'N/A'}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Expiry Date</Typography>
                  <Typography variant="body1">{selectedRecord.expiryDate || 'N/A'}</Typography>
                </Box>
              </Paper>
              
              {/* Damage Information */}
              {(selectedRecord.damageToPackaging || selectedRecord.damageToProduct) && (
                <>
                  <Typography variant="h6" gutterBottom>Damage Information</Typography>
                  <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Damage to Packaging</Typography>
                      <Typography variant="body1">{selectedRecord.damageToPackaging ? 'Yes' : 'No'}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Damage to Product</Typography>
                      <Typography variant="body1">{selectedRecord.damageToProduct ? 'Yes' : 'No'}</Typography>
                    </Box>
                    {selectedRecord.damageNotes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Damage Notes</Typography>
                        <Typography variant="body1">{selectedRecord.damageNotes}</Typography>
                      </Box>
                    )}
                  </Paper>
                </>
              )}
              
              {/* Receiver Signature */}
              {selectedRecord.receiverName && (
                <>
                  <Typography variant="h6" gutterBottom>Receiver Details</Typography>
                  <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Receiver Name</Typography>
                      <Typography variant="body1">{selectedRecord.receiverName}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Receiver Date</Typography>
                      <Typography variant="body1">{selectedRecord.receiverDate || 'N/A'}</Typography>
                    </Box>
                    {selectedRecord.receiverSign && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Receiver Signature</Typography>
                        <Box sx={{ mt: 1, border: '1px solid #eaeaea', p: 1 }}>
                          <img 
                            src={selectedRecord.receiverSign} 
                            alt="Receiver Signature" 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </>
              )}
              
              {/* Inspector Signature */}
              {selectedRecord.inspectorName && (
                <>
                  <Typography variant="h6" gutterBottom>Inspector Details</Typography>
                  <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Inspector Name</Typography>
                      <Typography variant="body1">{selectedRecord.inspectorName}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Inspector Date</Typography>
                      <Typography variant="body1">{selectedRecord.inspectorDate || 'N/A'}</Typography>
                    </Box>
                    {selectedRecord.inspectorSign && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Inspector Signature</Typography>
                        <Box sx={{ mt: 1, border: '1px solid #eaeaea', p: 1 }}>
                          <img 
                            src={selectedRecord.inspectorSign} 
                            alt="Inspector Signature" 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </>
              )}
              
              {/* Approver Signature */}
              {selectedRecord.approverName && (
                <>
                  <Typography variant="h6" gutterBottom>Approver Details</Typography>
                  <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Approver Name</Typography>
                      <Typography variant="body1">{selectedRecord.approverName}</Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Approver Date</Typography>
                      <Typography variant="body1">{selectedRecord.approverDate || 'N/A'}</Typography>
                    </Box>
                    {selectedRecord.approverSign && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Approver Signature</Typography>
                        <Box sx={{ mt: 1, border: '1px solid #eaeaea', p: 1 }}>
                          <img 
                            src={selectedRecord.approverSign} 
                            alt="Approver Signature" 
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </>
              )}

              {/* Attachment */}
              {selectedRecord.attachmentUrl && (
                <>
                  <Typography variant="h6" gutterBottom>Attachment</Typography>
                  <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9', display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      size="medium"
                      onClick={() => handleViewPDF(selectedRecord.attachmentUrl)}
                      startIcon={<PictureAsPdfIcon />}
                    >
                      View PDF
                    </Button>
                  </Paper>
                </>
              )}
            </Box>
          ) : (
            // Desktop table view (existing code)
            <Table>
              <TableBody>
                {/* Basic Information */}
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell>{selectedRecord.id}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Shipment Code</strong></TableCell>
                  <TableCell>{selectedRecord.shipmentCode}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Shipment Date</strong></TableCell>
                  <TableCell>{selectedRecord.shipmentDate}</TableCell>
                </TableRow>

                {/* Item Details */}
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

                {/* Quantity Information */}
                <TableRow>
                  <TableCell><strong>Quantities</strong></TableCell>
                  <TableCell>{selectedRecord.quantities}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Remaining Quantity</strong></TableCell>
                  <TableCell>{selectedRecord.remainingQuantity}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Unit</strong></TableCell>
                  <TableCell>{selectedRecord.unit}</TableCell>
                </TableRow>

                {/* New Fields */}
                <TableRow>
                  <TableCell><strong>Qualified Manufacturer</strong></TableCell>
                  <TableCell>{selectedRecord.qualifiedManufacturer}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Vendor</strong></TableCell>
                  <TableCell>{selectedRecord.vendor}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Transportation</strong></TableCell>
                  <TableCell>{selectedRecord.transportation}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Landing Bill Number</strong></TableCell>
                  <TableCell>{selectedRecord.landingBillNumber}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Expiry Date</strong></TableCell>
                  <TableCell>{selectedRecord.expiryDate}</TableCell>
                </TableRow>

                {/* Damage Information */}
                <TableRow>
                  <TableCell><strong>Damage to Packaging</strong></TableCell>
                  <TableCell>{selectedRecord.damageToPackaging ? 'Yes' : 'No'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Damage to Product</strong></TableCell>
                  <TableCell>{selectedRecord.damageToProduct ? 'Yes' : 'No'}</TableCell>
                </TableRow>
                {(selectedRecord.damageToPackaging || selectedRecord.damageToProduct) && (
                  <TableRow>
                    <TableCell><strong>Damage Notes</strong></TableCell>
                    <TableCell>{selectedRecord.damageNotes}</TableCell>
                  </TableRow>
                )}

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
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setViewDialogOpen(false)} variant={isMobile ? "contained" : "text"} fullWidth={isMobile}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        mb: 4 
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            color: 'primary.main', 
            mt: 2,
            fontSize: isMobile ? '1.75rem' : '2.125rem',
            mb: isMobile ? 2 : 0
          }}
        >
          Shipping Records
        </Typography>
        {/* Remove Home and Logout buttons */}
      </Box>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by Code or Item Name"
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

      {isMobile ? (
        // Mobile card list view
        <Box>
          {filteredRecords.length === 0 ? (
            <Typography align="center" sx={{ my: 4 }}>
              No records found
            </Typography>
          ) : (
            filteredRecords.map(renderMobileCard)
          )}
        </Box>
      ) : (
        // Desktop table view
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>ID</TableCell>
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
      )}

      <ViewDialog />
    </Container>
  );
};

export default Records;