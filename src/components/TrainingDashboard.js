import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { testDb } from '../firebase/testConfig';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PostAddIcon from '@mui/icons-material/PostAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewListIcon from '@mui/icons-material/ViewList';
import ApprovalIcon from '@mui/icons-material/Approval';
import ClassIcon from '@mui/icons-material/Class';
import DescriptionIcon from '@mui/icons-material/Description';

const TrainingDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTestUser, setIsTestUser] = useState(false);
  
  // SOP related states
  const [sopDialogOpen, setSopDialogOpen] = useState(false);
  const [sops, setSops] = useState([]);
  const [newSop, setNewSop] = useState({
    sopNumber: '',
    title: '',
    revision: ''
  });

  useEffect(() => {
    // Get user info from localStorage
    const storedName = localStorage.getItem('userName');
    const storedManager = localStorage.getItem('isManager') === 'true';
    const storedAdmin = localStorage.getItem('isAdmin') === 'true';
    const storedTestUser = localStorage.getItem('isTestUser') === 'true';
    
    setUserName(storedName || 'User');
    setIsManager(storedManager);
    setIsAdmin(storedAdmin);
    setIsTestUser(storedTestUser);
    
    // Fetch SOPs
    fetchSops();
  }, []);

  const fetchSops = async () => {
    try {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const dbInstance = isTestUser ? testDb : db;
      const collectionName = isTestUser ? 'test_sops' : 'sops';
      
      const q = query(
        collection(dbInstance, collectionName),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sopsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSops(sopsData);
    } catch (error) {
      console.error('Error fetching SOPs:', error);
    }
  };

  const handleAddSop = async () => {
    try {
      // Basic validation
      if (!newSop.sopNumber || !newSop.title || !newSop.revision) {
        alert('Please fill all required fields');
        return;
      }

      const dbInstance = isTestUser ? testDb : db;
      const collectionName = isTestUser ? 'test_sops' : 'sops';
      
      await addDoc(collection(dbInstance, collectionName), {
        ...newSop,
        createdAt: new Date().toISOString(),
        createdBy: userName
      });
      
      // Reset form and close dialog
      setNewSop({
        sopNumber: '',
        title: '',
        revision: ''
      });
      setSopDialogOpen(false);
      
      // Refresh SOPs list
      fetchSops();
    } catch (error) {
      console.error('Error adding SOP:', error);
      alert('Error adding SOP');
    }
  };

  const handleDeleteSop = async (id) => {
    try {
      if (window.confirm('Are you sure you want to delete this SOP?')) {
        const dbInstance = isTestUser ? testDb : db;
        const collectionName = isTestUser ? 'test_sops' : 'sops';
        
        await deleteDoc(doc(dbInstance, collectionName, id));
        
        // Refresh SOPs list
        fetchSops();
      }
    } catch (error) {
      console.error('Error deleting SOP:', error);
      alert('Error deleting SOP');
    }
  };

  const handleSopInputChange = (e) => {
    const { name, value } = e.target;
    setNewSop(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{  mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 600, 
            color: 'primary.main', 
            textAlign: 'center',
            mb: 4 
          }}
        >
          Training Dashboard
        </Typography>
        
        <Typography variant="h6" sx={{ mb: 3 }}>
          Welcome, {userName}! 
        </Typography>

        <Grid container spacing={3} sx={{ mb: 8 }}>
          {/* Individual User Training Cards */}
          <Grid item xs={12} md={6} lg={4} mb={8}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Box>
                <AssignmentIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  My Training Records
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/training/records')}
                sx={{ mt: 2 }}
              >
                View My Records
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={4} mb={8}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Box>
                <PostAddIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  Submit Self-Training
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/training/self-training-form')}
                sx={{ mt: 2 }}
              >
                Submit Training
              </Button>
            </Paper>
          </Grid>

          {/* Manager/Admin Only Section */}
          {(isManager || isAdmin) && (
            <>
              <Grid item xs={12} md={6} lg={4} mb={8}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                    bgcolor: 'rgba(25, 118, 210, 0.05)',
                  }}
                >
                  <Box>
                    <ApprovalIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                      Approve Training
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/training/approve')}
                    sx={{ mt: 2 }}
                  >
                    Approve Requests
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} lg={4} mb={8}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                    bgcolor: 'rgba(25, 118, 210, 0.05)',
                  }}
                >
                  <Box>
                    <ViewListIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                      All Training Records
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/training/all-records')}
                    sx={{ mt: 2 }}
                  >
                    View All Records
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} lg={4} mb={8}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                    bgcolor: 'rgba(25, 118, 210, 0.05)',
                  }}
                >
                  <Box>
                    <ClassIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                      Submit In-Class Training
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/training/in-class-training-form')}
                    sx={{ mt: 2 }}
                  >
                    Submit Class
                  </Button>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>

        {/* SOP Management Section for Managers and Admins */}
        {(isManager || isAdmin || isTestUser) && (
          <Box sx={{ mt: 5 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: 30, color: 'primary.main', mr: 1 }} />
                  <Typography variant="h5">SOP Management</Typography>
                </Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => setSopDialogOpen(true)}
                  startIcon={<PostAddIcon />}
                >
                  Add New SOP
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>SOP Number</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Revision</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Created By</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sops.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          No SOPs found. Add your first SOP!
                        </TableCell>
                      </TableRow>
                    ) : (
                      sops.map((sop, index) => (
                        <TableRow key={sop.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{sop.sopNumber}</TableCell>
                          <TableCell>{sop.title}</TableCell>
                          <TableCell>{sop.revision}</TableCell>
                          <TableCell>{sop.createdBy || 'N/A'}</TableCell>
                          <TableCell>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteSop(sop.id)}
                              title="Delete SOP"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {isTestUser && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                  Note: Test user SOPs will be deleted when you log out.
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        {/* Add SOP Dialog */}
        <Dialog open={sopDialogOpen} onClose={() => setSopDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New SOP</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                required
                label="SOP Number"
                name="sopNumber"
                value={newSop.sopNumber}
                onChange={handleSopInputChange}
              />
              <TextField
                fullWidth
                required
                label="Title"
                name="title"
                value={newSop.title}
                onChange={handleSopInputChange}
              />
              <TextField
                fullWidth
                required
                label="Revision"
                name="revision"
                value={newSop.revision}
                onChange={handleSopInputChange}
                placeholder="e.g., 1.0, A, etc."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSopDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" color="primary" onClick={handleAddSop}>Add SOP</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default TrainingDashboard;
