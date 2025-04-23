import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Alert,
  Button,
  IconButton
} from '@mui/material';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { testDb, testAuth } from '../firebase/testConfig';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TrainingViewDialog from './common/TrainingViewDialog';
import ApprovalDialog from './common/ApprovalDialog';

const ApproveTraining = () => {
  const [pendingRecords, setPendingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('approve'); // State for dialog mode ('approve' or 'reject')
  const [selectedRecord, setSelectedRecord] = useState(null);
  const navigate = useNavigate();

  const getDbInstance = () => localStorage.getItem('isTestUser') === 'true' ? testDb : db;
  const getAuthInstance = () => localStorage.getItem('isTestUser') === 'true' ? testAuth : auth;
  const getCollectionName = () => localStorage.getItem('isTestUser') === 'true' ? 'test_selfTrainings' : 'selfTrainings';

  const fetchPendingRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    const authInstance = getAuthInstance();
    const user = authInstance.currentUser;

    if (!user) {
      setError('User not logged in.');
      setLoading(false);
      return;
    }

    try {
      const dbInstance = getDbInstance();
      const collectionName = getCollectionName();
      
      // Query records with status 'pending'
      const q = query(
        collection(dbInstance, collectionName),
        where('status', '==', 'pending'),
        orderBy('submittedAt', 'asc') // Oldest first
      );

      const querySnapshot = await getDocs(q);
      const fetchedRecords = querySnapshot.docs
        .map(doc => ({
          docId: doc.id, 
          ...doc.data()
        }))
        .filter(record => record.userId !== user.uid); // Filter out manager's own records
      
      setPendingRecords(fetchedRecords);
    } catch (err) {
      console.error("Error fetching pending training records:", err);
      setError(`Failed to load records: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRecords();
  }, [fetchPendingRecords]);

  // Opens the approval dialog in 'approve' mode
  const handleApproveClick = (record) => {
    setSelectedRecord(record);
    setDialogMode('approve'); // Set mode to approve
    setApprovalDialogOpen(true);
  };

  // Opens the approval dialog in 'reject' mode
  const handleRejectClick = (record) => {
    setSelectedRecord(record);
    setDialogMode('reject'); // Set mode to reject
    setApprovalDialogOpen(true);
  };

  // Combined handler for saving from the dialog
  const handleSaveAction = async (actionData) => {
    if (!selectedRecord) return;

    const dbInstance = getDbInstance();
    const collectionName = getCollectionName();
    const recordRef = doc(dbInstance, collectionName, selectedRecord.docId);
    const actor = getAuthInstance().currentUser; // The user performing the action

    const updateData = {
      status: actionData.mode === 'approve' ? 'approved' : 'rejected',
      actorId: actor.uid, // Generic field for approver/rejecter ID
      actorName: localStorage.getItem('userName') || actor.email.split('@')[0], // Generic field for name
      actionNotes: actionData.notes, // Generic field for notes
      actionSign: actionData.signature, // Generic field for signature
      actionDate: actionData.date, // Generic field for date signed
      processedAt: new Date().toISOString() // Timestamp of approval/rejection
    };

    // Add attachment details only if approving
    if (actionData.mode === 'approve') {
      updateData.attachmentUrl = actionData.attachmentUrl;
      updateData.attachmentName = actionData.attachmentName;
    }

    try {
      await updateDoc(recordRef, updateData);
      fetchPendingRecords(); // Refresh list
      alert(`Record ${updateData.status} successfully.`);
    } catch (err) {
      console.error(`Error ${actionData.mode === 'approve' ? 'approving' : 'rejecting'} record:`, err);
      alert(`Failed to ${actionData.mode} record: ${err.message}`);
    }
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) { return 'Invalid Date'; }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3, 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" component="h1" sx={{ 
          color: 'primary.main',
          fontSize: { xs: '1.75rem', sm: '2.125rem' } 
        }}>
          Approve Training Records
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/training')}>
          Back to Training Dashboard
        </Button>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {!loading && !error && (
        pendingRecords.length === 0 ? (
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No pending training records require your approval.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: '4px' }}>
            <Table sx={{ minWidth: { xs: '100%', md: 650 } }} size={window.innerWidth < 600 ? "small" : "medium"}>
              <TableHead sx={{ backgroundColor: 'primary.light' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', p: { xs: 1, sm: 2 } }}>Trainee</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', p: { xs: 1, sm: 2 } }}>SOP</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 'bold' }}>Revision</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', p: { xs: 1, sm: 2 } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRecords.map((record) => (
                  <TableRow key={record.docId} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                    <TableCell sx={{ 
                      p: { xs: 1, sm: 2 },
                      maxWidth: { xs: '120px', sm: 'auto' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: { xs: 'nowrap', sm: 'normal' }
                    }}>
                      {record.traineeName}
                    </TableCell>
                    <TableCell sx={{ 
                      p: { xs: 1, sm: 2 },
                      maxWidth: { xs: '100px', sm: 'auto' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: { xs: 'nowrap', sm: 'normal' }
                    }}>
                      {record.sopNumber}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{record.revision}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(record.submittedAt)}</TableCell>
                    <TableCell sx={{ p: { xs: 0.5, sm: 1 } }}>
                      <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.5 }}>
                        <IconButton 
                          color="primary" 
                          size="small" 
                          onClick={() => handleView(record)} 
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="success" 
                          size="small" 
                          onClick={() => handleApproveClick(record)} 
                          title="Approve"
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => handleRejectClick(record)} 
                          title="Reject"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* Add a mobile helper text */}
      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', md: 'none' }, mt: 1, ml: 1 }}>
        * Swipe horizontally to see more columns
      </Typography>

      {/* View Dialog */}
      {selectedRecord && (
        <TrainingViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          record={selectedRecord}
        />
      )}

      {/* Approval/Rejection Dialog */}
      {selectedRecord && (
        <ApprovalDialog
          open={approvalDialogOpen}
          onClose={() => setApprovalDialogOpen(false)}
          onSave={handleSaveAction}
          record={selectedRecord}
          mode={dialogMode}
        />
      )}
    </Container>
  );
};

export default ApproveTraining;
