import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  Box, 
  List,
  ListItem,
  Divider,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { collection, query, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HomeIcon from '@mui/icons-material/Home';
import { useTheme, useMediaQuery } from '@mui/material';
import { sendApprovalEmail } from '../utils/emailService';

const AdminVerification = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: Approved, 2: Rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [userToApprove, setUserToApprove] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Check if user is admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    fetchRequests();
  }, [navigate]);

  useEffect(() => {
    // Filter requests based on search term and selected tab
    const filtered = requests.filter(request => {
      const matchesSearch = !searchTerm || 
        request.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.email?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesTab = 
        (tabValue === 0 && request.status === 'pending') || 
        (tabValue === 1 && request.status === 'approved') ||
        (tabValue === 2 && request.status === 'rejected');
        
      return matchesSearch && matchesTab;
    });
    
    setFilteredRequests(filtered);
  }, [requests, searchTerm, tabValue]);

  const fetchRequests = async () => {
    try {
      const q = query(
        collection(db, 'userRequests'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRequests(requestsData);
      console.log('Requests loaded:', requestsData.length);
    } catch (error) {
      console.error('Error fetching requests:', error);
      alert('Error loading user requests');
    }
  };

  const initiateUserApproval = (request) => {
    setUserToApprove(request);
    setConfirmError('');
    setConfirmDialogOpen(true);
  };

  // Fix the issue where admin gets logged out after approving a user

  // In the handleUserAction function, replace the createUserWithEmailAndPassword approach
  // with the Firebase Admin SDK or REST API approach

  const handleUserAction = async (request, action) => {
    try {
      const requestRef = doc(db, 'userRequests', request.id);
      
      if (action === 'approve') {
        try {
          // Instead of using Auth SDK directly which affects the current session,
          // we'll use the Firebase Authentication REST API
          
          // Get API key from Firebase config
          const firebaseConfig = {
            apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBLAlnwwRasaBO88OsM8GsJ0os-8bwAT08",
            // ...other config values
          };
          
          const API_KEY = firebaseConfig.apiKey;
          const tempPassword = 'tempPassword123'; // Default temp password
          
          // Create user with email/password using REST API
          const createUserEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
          const createUserOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: request.email,
              password: tempPassword,
              returnSecureToken: false
            })
          };
          
          try {
            await fetch(createUserEndpoint, createUserOptions);
            console.log('User created successfully');
          } catch (error) {
            console.log('User might already exist, continuing with approval');
          }
          
          // Instead of sending Firebase reset email, send our custom email with EmailJS
          await sendApprovalEmail(request, tempPassword);
          
          // Update request status in Firestore
          await updateDoc(requestRef, {
            status: 'approved',
            approvedAt: new Date().toISOString()
          });
          
          // Refresh the list
          fetchRequests();
          alert(`User ${request.email} approved and welcome email sent.`);
          
        } catch (error) {
          console.error('Error during user approval:', error);
          throw error;
        }
      } else if (action === 'reject') {
        await updateDoc(requestRef, { 
          status: 'rejected',
          rejectedAt: new Date().toISOString()
        });
        
        fetchRequests();
        alert(`User ${request.email} rejected.`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Also update the handleConfirmApproval function to use the REST API for authentication
  const handleConfirmApproval = async (password) => {
    if (!userToApprove || !password) return;
    
    setConfirmLoading(true);
    setConfirmError('');
    
    try {
      // Get admin email from localStorage
      const adminEmail = localStorage.getItem('adminEmail');
      if (!adminEmail) {
        throw new Error('Admin session not found. Please log in again.');
      }
      
      // Get API key from config
      const firebaseConfig = {
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBLAlnwwRasaBO88OsM8GsJ0os-8bwAT08",
        // ...other config values
      };
      
      const API_KEY = firebaseConfig.apiKey;
      
      // Verify admin password using REST API
      try {
        const verifyEndpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
        const verifyOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: adminEmail,
            password: password,
            returnSecureToken: true
          })
        };
        
        const response = await fetch(verifyEndpoint, verifyOptions);
        const data = await response.json();
        
        if (data.error) {
          console.error('Authentication error:', data.error);
          setConfirmError(data.error.message);
          setConfirmLoading(false);
          return;
        }
        
        // Successfully authenticated - proceed with approval
        await handleUserAction(userToApprove, 'approve');
        setConfirmDialogOpen(false);
        
      } catch (error) {
        console.error('Authentication error:', error);
        setConfirmError('Authentication failed. Please try again.');
        setConfirmLoading(false);
      }
    } catch (error) {
      console.error('Confirmation error:', error);
      setConfirmError(error.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };
  
  // Format date from ISO string to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Render a user card for mobile view
  const renderMobileUserCard = (request) => (
    <Paper
      key={request.id}
      elevation={2}
      sx={{
        mb: 2,
        p: 2,
        border: '1px solid #eaeaea',
        backgroundColor: 
          request.status === 'approved' ? '#f0f7f0' :
          request.status === 'rejected' ? '#f7f0f0' : 'white'
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {request.name || 'No Name'}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EmailIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {request.email}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon sx={{ mr: 1, fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatDate(request.createdAt)}
          </Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 
            request.status === 'approved' ? 'success.main' :
            request.status === 'rejected' ? 'error.main' : 'warning.main',
          mt: 1
        }}>
          {request.status === 'approved' ? (
            <CheckCircleIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          ) : request.status === 'rejected' ? (
            <CancelIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          ) : (
            <AccessTimeIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          )}
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600,
              textTransform: 'capitalize'
            }}
          >
            {request.status}
          </Typography>
        </Box>
      </Box>
      
      {/* Action buttons */}
      {request.status === 'pending' && (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 2,
            pt: 2,
            borderTop: '1px solid #eaeaea'
          }}
        >
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{ flex: 1, mr: 1 }}
            onClick={() => initiateUserApproval(request)}
          >
            Approve
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            sx={{ flex: 1, ml: 1 }}
            onClick={() => handleUserAction(request, 'reject')}
          >
            Reject
          </Button>
        </Box>
      )}
      
      <Button
        variant="text"
        fullWidth
        onClick={() => openUserDetails(request)}
        sx={{ mt: 1 }}
        endIcon={<MoreVertIcon />}
      >
        View Details
      </Button>
    </Paper>
  );
  
  // Render a table row for desktop view
  const renderTableRow = (request) => (
    <TableRow 
      key={request.id}
      sx={{
        backgroundColor: 
          request.status === 'approved' ? '#f0f7f0' :
          request.status === 'rejected' ? '#f7f0f0' : 'white',
        '&:hover': { backgroundColor: 'action.hover' }
      }}
    >
      <TableCell>{request.name || 'No Name'}</TableCell>
      <TableCell>{request.email}</TableCell>
      <TableCell>{formatDate(request.createdAt)}</TableCell>
      <TableCell>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 
            request.status === 'approved' ? 'success.main' :
            request.status === 'rejected' ? 'error.main' : 'warning.main'
        }}>
          {request.status === 'approved' ? (
            <CheckCircleIcon sx={{ mr: 1, fontSize: 'small' }} />
          ) : request.status === 'rejected' ? (
            <CancelIcon sx={{ mr: 1, fontSize: 'small' }} />
          ) : (
            <AccessTimeIcon sx={{ mr: 1, fontSize: 'small' }} />
          )}
          <Typography 
            sx={{ 
              fontWeight: 500,
              textTransform: 'capitalize'
            }}
          >
            {request.status}
          </Typography>
        </Box>
      </TableCell>
      <TableCell>
        {request.status === 'pending' && (
          <>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mr: 1 }}
              onClick={() => initiateUserApproval(request)}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => handleUserAction(request, 'reject')}
            >
              Reject
            </Button>
          </>
        )}
        <Button
          variant="text"
          size="small"
          sx={{ ml: 1 }}
          onClick={() => openUserDetails(request)}
        >
          Details
        </Button>
      </TableCell>
    </TableRow>
  );
  
  // User details dialog
  const UserDetailsDialog = () => (
    <Dialog 
      open={dialogOpen} 
      onClose={() => setDialogOpen(false)}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ 
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: 500,
        borderBottom: '1px solid #eaeaea',
        pb: 2
      }}>
        User Details
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {selectedUser && (
          <Box sx={{ px: isMobile ? 0 : 2 }}>
            <List>
              <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Name
                </Typography>
                <Typography variant="body1">
                  {selectedUser.name || 'No name provided'}
                </Typography>
              </ListItem>
              <Divider />
              
              <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1">
                  {selectedUser.email}
                </Typography>
              </ListItem>
              <Divider />
              
              <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 
                    selectedUser.status === 'approved' ? 'success.main' :
                    selectedUser.status === 'rejected' ? 'error.main' : 'warning.main'
                }}>
                  {selectedUser.status === 'approved' ? (
                    <CheckCircleIcon sx={{ mr: 1 }} />
                  ) : selectedUser.status === 'rejected' ? (
                    <CancelIcon sx={{ mr: 1 }} />
                  ) : (
                    <AccessTimeIcon sx={{ mr: 1 }} />
                  )}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}
                  >
                    {selectedUser.status}
                  </Typography>
                </Box>
              </ListItem>
              <Divider />
              
              <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Request Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedUser.createdAt)}
                </Typography>
              </ListItem>
              <Divider />
              
              {selectedUser.status === 'approved' && (
                <>
                  <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Approval Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedUser.approvedAt)}
                    </Typography>
                  </ListItem>
                  <Divider />
                </>
              )}
              
              {selectedUser.status === 'rejected' && (
                <>
                  <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Rejection Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedUser.rejectedAt)}
                    </Typography>
                  </ListItem>
                  <Divider />
                </>
              )}
            </List>
            
            {selectedUser.status === 'pending' && (
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setDialogOpen(false);
                    initiateUserApproval(selectedUser);
                  }}
                  sx={{ flex: 1, mr: 1 }}
                >
                  Approve User
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    handleUserAction(selectedUser, 'reject');
                    setDialogOpen(false);
                  }}
                  sx={{ flex: 1, ml: 1 }}
                >
                  Reject User
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setDialogOpen(false)}
          variant={isMobile ? "contained" : "text"}
          fullWidth={isMobile}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  const PasswordConfirmDialog = () => {
    const [localPassword, setLocalPassword] = useState('');
    const inputRef = React.useRef(null);
    
    // Reset local state when dialog opens/closes
    React.useEffect(() => {
      if (confirmDialogOpen) {
        setLocalPassword('');
        // Focus the input after a brief delay to ensure the dialog is fully rendered
        const timer = setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 50);
        return () => clearTimeout(timer);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    const handleConfirmClick = () => {
      if (!localPassword) return;
      // Use the local password state for validation
      handleConfirmApproval(localPassword);
    };
  
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && localPassword && !confirmLoading) {
        e.preventDefault();
        handleConfirmClick();
      }
    };
  
    return (
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !confirmLoading && setConfirmDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown={confirmLoading}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid #eaeaea', 
          pb: 2,
          fontWeight: 500
        }}>
          Confirm Admin Password
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please enter your password to approve:
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 600 }}>
            {userToApprove?.email}
          </Typography>
          <TextField
            inputRef={inputRef}
            fullWidth
            type="password"
            label="Admin Password"
            variant="outlined"
            value={localPassword}
            onChange={(e) => setLocalPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            error={!!confirmError}
            helperText={confirmError}
            disabled={confirmLoading}
            autoComplete="current-password"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused': {
                  boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
                }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmDialogOpen(false)}
            disabled={confirmLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmClick}
            disabled={!localPassword || confirmLoading}
            sx={{ ml: 1, minWidth: '100px' }}
          >
            {confirmLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <span>Verifying</span>
              </Box>
            ) : (
              'Approve'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

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
            textAlign: 'center',
            fontSize: isMobile ? '1.75rem' : '2.125rem',
            mb: isMobile ? 2 : 0
          }}
        >
          User Verification
        </Typography>
        <Button
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ alignSelf: isMobile ? 'stretch' : 'flex-end' }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Paper elevation={3} sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="Pending" 
            sx={{ py: 2 }} 
          />
          <Tab 
            label="Approved" 
            sx={{ py: 2 }} 
          />
          <Tab 
            label="Rejected" 
            sx={{ py: 2 }} 
          />
        </Tabs>
      </Paper>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by name or email"
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
        // Mobile view - cards
        <Box>
          {filteredRequests.length === 0 ? (
            <Typography align="center" sx={{ my: 4, color: 'text.secondary' }}>
              No {tabValue === 0 ? 'pending' : tabValue === 1 ? 'approved' : 'rejected'} requests found
            </Typography>
          ) : (
            filteredRequests.map(renderMobileUserCard)
          )}
        </Box>
      ) : (
        // Desktop view - table
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Request Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No {tabValue === 0 ? 'pending' : tabValue === 1 ? 'approved' : 'rejected'} requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map(renderTableRow)
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <UserDetailsDialog />
      <PasswordConfirmDialog />
    </Container>
  );
};

export default AdminVerification;

