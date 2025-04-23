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
  IconButton,
  useMediaQuery,
  useTheme
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userName, setUserName] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTestUser, setIsTestUser] = useState(false);
  const [sopDialogOpen, setSopDialogOpen] = useState(false);
  const [sops, setSops] = useState([]);
  const [newSop, setNewSop] = useState({
    sopNumber: '',
    title: '',
    revision: ''
  });

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedManager = localStorage.getItem('isManager') === 'true';
    const storedAdmin = localStorage.getItem('isAdmin') === 'true';
    const storedTestUser = localStorage.getItem('isTestUser') === 'true';
    setUserName(storedName || 'User');
    setIsManager(storedManager);
    setIsAdmin(storedAdmin);
    setIsTestUser(storedTestUser);
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
      setNewSop({
        sopNumber: '',
        title: '',
        revision: ''
      });
      setSopDialogOpen(false);
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
      <Box sx={{ mb: 4 }}>
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
        
        <Grid container spacing={2} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={4} lg={4} mb={8}>
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
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
                <AssignmentIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" component="h2" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  My Training Records
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/training/records')}
                sx={{ mt: 2 }}
                fullWidth
              >
                View My Records
              </Button>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={4} mb={8}>
            <Paper
              elevation={3}
              sx={{
                p: { xs: 2, sm: 3 },
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
                <PostAddIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" component="h2" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Submit Self-Training
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/training/self-training-form')}
                sx={{ mt: 2 }}
                fullWidth
              >
                Submit Training
              </Button>
            </Paper>
          </Grid>

          {(isManager || isAdmin) && (
            <>
              <Grid item xs={12} sm={6} md={4} lg={4} mb={8}>
                <Paper
                  elevation={3}
                  sx={{
                    p: { xs: 2, sm: 3 },
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
                    <ApprovalIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" component="h2" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      Approve Training
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/training/approve')}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Approve Requests
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={4} mb={8}>
                <Paper
                  elevation={3}
                  sx={{
                    p: { xs: 2, sm: 3 },
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
                    <ViewListIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" component="h2" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      All Training Records
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/training/all-records')}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    View All Records
                  </Button>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={4} mb={8}>
                <Paper
                  elevation={3}
                  sx={{
                    p: { xs: 2, sm: 3 },
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
                    <ClassIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" component="h2" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      Submit In-Class Training
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/training/in-class-training-form')}
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Submit Class
                  </Button>
                </Paper>
              </Grid>
            </>
          )}
        </Grid>

        {(isManager || isAdmin || isTestUser) && (
          <Box sx={{ mt: 5 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' }, 
                mb: 3,
                gap: { xs: 2, sm: 0 }
              }}> 
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'primary.main', mr: 1 }} />
                  <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>SOP Management</Typography>
                </Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={() => setSopDialogOpen(true)}
                  startIcon={<PostAddIcon />}
                  size="medium"
                  fullWidth={isMobile}
                >
                  Add New SOP 
                </Button>
              </Box>

              <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.main' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 600, p: { xs: 1, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, p: { xs: 1, sm: 2 } }}>SOP Number</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, p: { xs: 1, sm: 2 } }}>Title</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, p: { xs: 1, sm: 2 }, display: { xs: 'none', md: 'table-cell' } }}>Revision</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, p: { xs: 1, sm: 2 }, display: { xs: 'none', md: 'table-cell' } }}>Created By</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600, p: { xs: 1, sm: 2 } }}>Actions</TableCell>
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
                        <TableRow key={sop.id} hover>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, p: { xs: 1, sm: 2 } }}>{index + 1}</TableCell>
                          <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{sop.sopNumber}</TableCell>
                          <TableCell sx={{ p: { xs: 1, sm: 2 } }}>{sop.title}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, p: { xs: 1, sm: 2 } }}>{sop.revision}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, p: { xs: 1, sm: 2 } }}>{sop.createdBy || 'N/A'}</TableCell>
                          <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteSop(sop.id)}
                              title="Delete SOP"
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
                * Swipe horizontally to see all details.
              </Typography>

              {isTestUser && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                  Note: Test user SOPs will be deleted when you log out.
                </Typography>
              )}
            </Paper>
          </Box>
        )}

        <Dialog 
          open={sopDialogOpen} 
          onClose={() => setSopDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>Add New SOP</DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                required
                label="SOP Number"
                name="sopNumber"
                value={newSop.sopNumber}
                onChange={handleSopInputChange}
                size={isMobile ? "small" : "medium"}
              />
              <TextField
                fullWidth
                required
                label="Title"
                name="title"
                value={newSop.title}
                onChange={handleSopInputChange}
                size={isMobile ? "small" : "medium"}
              />
              <TextField
                fullWidth
                required
                label="Revision"
                name="revision"
                value={newSop.revision}
                onChange={handleSopInputChange}
                placeholder="e.g., 1.0, A, etc."
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch' }}>
            <Button 
              onClick={() => setSopDialogOpen(false)} 
              fullWidth={isMobile}
              sx={{ mb: { xs: 1, sm: 0 } }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddSop} 
              fullWidth={isMobile}
            >
              Add SOP
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default TrainingDashboard;
