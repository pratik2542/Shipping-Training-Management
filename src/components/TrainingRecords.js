import React, { useState, useEffect } from 'react';
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
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { testDb, testAuth } from '../firebase/testConfig';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrainingViewDialog from './common/TrainingViewDialog';

const TrainingRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const navigate = useNavigate();

  const getDbInstance = () => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    return isTestUser ? testDb : db;
  };

  const getAuthInstance = () => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    return isTestUser ? testAuth : auth;
  };

  const getCollectionName = () => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    return isTestUser ? 'test_selfTrainings' : 'selfTrainings';
  };

  useEffect(() => {
    const fetchRecords = async () => {
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
        
        const q = query(
          collection(dbInstance, collectionName),
          where('userId', '==', user.uid),
          orderBy('submittedAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedRecords = querySnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        
        setRecords(fetchedRecords);
      } catch (err) {
        console.error("Error fetching training records:", err);
        setError(`Failed to load records: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
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
          My Training Records
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/training')}>
          Back to Training Dashboard
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      )}

      {!loading && !error && (
        records.length === 0 ? (
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">You have not submitted any training records yet.</Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/training/self-training-form')}>
              Submit Self Training
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: '100%', md: 650 } }}>
              <TableHead sx={{ backgroundColor: 'primary.light' }}>
                <TableRow>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', p: { xs: 1, sm: 2 } }}>SOP Number</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 'bold' }}>Revision</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 'bold' }}>Trainee Name</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 'bold' }}>Date Submitted</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', p: { xs: 1, sm: 2 } }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', p: { xs: 1, sm: 2 } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.docId} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{record.id || 'N/A'}</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{record.sopNumber}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{record.revision}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{record.traineeName}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDate(record.submittedAt)}</TableCell>
                    <TableCell sx={{ 
                      textTransform: 'capitalize', 
                      color: record.status === 'pending' ? 'orange' : record.status === 'approved' ? 'green' : 'red',
                      p: { xs: 1, sm: 2 },
                      fontWeight: 'medium'
                    }}>
                      {record.status || 'Unknown'}
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                      <IconButton color="primary" size="small" onClick={() => handleView(record)} title="View Details">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {selectedRecord && (
        <TrainingViewDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          record={selectedRecord}
        />
      )}
    </Container>
  );
};

export default TrainingRecords;
