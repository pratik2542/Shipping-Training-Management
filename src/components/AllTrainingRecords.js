import React, { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { testDb } from '../firebase/testConfig';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import TrainingViewDialog from './common/TrainingViewDialog';

const AllTrainingRecords = () => {
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const navigate = useNavigate();

  const getDbInstance = () => localStorage.getItem('isTestUser') === 'true' ? testDb : db;
  const getCollectionName = () => localStorage.getItem('isTestUser') === 'true' ? 'test_selfTrainings' : 'selfTrainings';

  useEffect(() => {
    const fetchAllRecords = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const dbInstance = getDbInstance();
        const collectionName = getCollectionName();
        
        // Query all records, order by submission date
        const q = query(
          collection(dbInstance, collectionName),
          orderBy('submittedAt', 'desc') 
        );

        const querySnapshot = await getDocs(q);
        const fetchedRecords = querySnapshot.docs.map(doc => ({
          docId: doc.id, 
          ...doc.data()
        }));
        
        setAllRecords(fetchedRecords);
      } catch (err) {
        console.error("Error fetching all training records:", err);
        setError(`Failed to load records: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRecords();
  }, []); 

  const handleView = (record) => {
    setSelectedRecord(record);
    setViewDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString(); } 
    catch (e) { return 'Invalid Date'; }
  };

  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      const matchesSearch = !searchTerm ||
        record.traineeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.sopNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allRecords, searchTerm, statusFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'pending': return 'orange';
      default: return 'inherit';
    }
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
          All Training Records
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/training')}>
          Back to Training Dashboard
        </Button>
      </Box>

      {/* Filter and Search Controls */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2 }, 
        mb: 3, 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1.5, sm: 2 }, 
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        <TextField
          label="Search by Trainee or SOP"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ 
            flexGrow: 1, 
            minWidth: { xs: '100%', sm: '250px' },
            maxWidth: { xs: '100%', sm: 'none' } // Remove the max-width constraint
          }}
        />
        <FormControl size="small" sx={{ 
          width: { xs: '100%', sm: '180px' },
          flexShrink: 0
        }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {!loading && !error && (
        filteredRecords.length === 0 ? (
          <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No training records found matching your criteria.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: '4px' }}>
            <Table sx={{ minWidth: { xs: '100%', md: 650 } }} size={window.innerWidth < 600 ? "small" : "medium"}>
              <TableHead sx={{ backgroundColor: 'primary.light' }}>
                <TableRow>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 'bold' }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', p: { xs: 1, sm: 2 } }}>Trainee</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', p: { xs: 1, sm: 2 } }}>SOP</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontWeight: 'bold' }}>Revision</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', p: { xs: 1, sm: 2 } }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', p: { xs: 1, sm: 2 } }}>View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.docId} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{record.id || 'N/A'}</TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 }, maxWidth: { xs: '120px', sm: 'auto' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {record.traineeName}
                    </TableCell>
                    <TableCell sx={{ p: { xs: 1, sm: 2 }, maxWidth: { xs: '100px', sm: 'auto' }, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {record.sopNumber}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{record.revision}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{formatDate(record.submittedAt)}</TableCell>
                    <TableCell 
                      sx={{ 
                        textTransform: 'capitalize', 
                        color: getStatusColor(record.status), 
                        p: { xs: 1, sm: 2 },
                        fontWeight: 'medium'
                      }}
                    >
                      {record.status || 'Unknown'}
                    </TableCell>
                    <TableCell sx={{ p: { xs: 0.5, sm: 1 } }}>
                      <IconButton 
                        color="primary" 
                        size="small" 
                        onClick={() => handleView(record)} 
                        title="View Details"
                        sx={{ 
                          p: { xs: 0.5, sm: 1 }
                        }}
                      >
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
    </Container>
  );
};

export default AllTrainingRecords;
