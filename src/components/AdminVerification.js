import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Snackbar,
  Alert,
  Autocomplete,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel
} from '@mui/material';
import { collection, query, getDocs, doc, updateDoc, orderBy, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useTheme, useMediaQuery } from '@mui/material';
import { sendApprovalEmail } from '../utils/emailService';
import { createUser, verifyPassword } from '../utils/firebaseAuthApi';
import { addManager, removeManager, getAllManagers } from '../utils/userRoles';

const AdminVerification = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [tabValue, setTabValue] = useState(0); // 0: Pending, 1: Approved, 2: Rejected, 3: Managers
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [userToAction, setUserToAction] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'delete', or 'changeAccess'
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('both'); // 'shipping', 'training', 'both' - Default to 'both'
  const [managers, setManagers] = useState([]);
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [approvedUsers, setApprovedUsers] = useState([]);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const fetchManagers = useCallback(async () => {
    try {
      const managersData = await getAllManagers();
      setManagers(managersData);
    } catch (error) {
      console.error('Error fetching managers:', error);
      showSnackbar('Error fetching managers', 'error');
    }
  }, []);
  
  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

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

  const fetchApprovedUsers = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'userRequests'),
        where('status', '==', 'approved')
      );
      const snapshot = await getDocs(q);
      const approvedUsersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApprovedUsers(approvedUsersData);
    } catch (error) {
      console.error('Error fetching approved users:', error);
      showSnackbar('Error fetching approved users', 'error');
    }
  }, []);

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    
    fetchRequests();
    
    if (tabValue === 3) {
      fetchManagers();
      fetchApprovedUsers();
    }
  }, [navigate, tabValue, fetchManagers, fetchApprovedUsers]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam !== null) {
      const tabValue = parseInt(tabParam);
      if (!isNaN(tabValue) && tabValue >= 0 && tabValue <= 3) {
        setTabValue(tabValue);
      }
    }
  }, [location.search]);

  useEffect(() => {
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

  const initiateUserAction = (request, action) => {
    setUserToAction(request);
    setActionType(action);
    setSelectedAccessLevel(request.accessLevel || 'both');
    setConfirmError('');
    setConfirmDialogOpen(true);
  };

  const handleUserAction = async (request, action, accessLevel) => {
    try {
      const requestRef = doc(db, 'userRequests', request.id);
      
      if (action === 'approve') {
        try {
          const tempPassword = 'tempPassword123';
          
          try {
            await createUser(request.email, tempPassword);
            console.log('User created successfully');
          } catch (error) {
            console.log('User might already exist, continuing with approval');
          }
          
          await sendApprovalEmail(request, tempPassword);
          
          await updateDoc(requestRef, {
            status: 'approved',
            approvedAt: new Date().toISOString(),
            accessLevel: accessLevel
          });
          
          fetchRequests();
          showSnackbar(`User ${request.email} approved with ${accessLevel} access.`, 'success');
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
        showSnackbar(`User ${request.email} rejected.`, 'warning');
      } else if (action === 'delete') {
        await deleteDoc(requestRef);
        fetchRequests();
        showSnackbar(`User ${request.email} deleted.`, 'success');
      } else if (action === 'changeAccess') {
        if (!accessLevel) {
          throw new Error('Access level must be selected.');
        }
        await updateDoc(requestRef, {
          accessLevel: accessLevel,
          lastUpdatedByAdmin: localStorage.getItem('adminEmail'),
          lastUpdatedAt: new Date().toISOString()
        });
        fetchRequests();
        fetchApprovedUsers();
        showSnackbar(`Access level for ${request.email} updated to ${accessLevel}.`, 'success');
      }
    } catch (error) {
      console.error(`Error during user ${action}:`, error);
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  const handleConfirmAction = async (password) => {
    if (!userToAction || !password || !actionType) return;

    if ((actionType === 'approve' || actionType === 'changeAccess') && !selectedAccessLevel) {
      setConfirmError('Please select an access level for the user.');
      return;
    }
    
    setConfirmLoading(true);
    setConfirmError('');
    
    try {
      const adminEmail = localStorage.getItem('adminEmail');
      if (!adminEmail) {
        throw new Error('Admin session not found. Please log in again.');
      }
      
      try {
        const result = await verifyPassword(adminEmail, password);
        
        if (result.error) {
          setConfirmError(result.error.message || 'Invalid password');
          setConfirmLoading(false);
          return;
        }
        
        await handleUserAction(userToAction, actionType, (actionType === 'approve' || actionType === 'changeAccess') ? selectedAccessLevel : undefined);
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

  const isAlreadyManager = useCallback((email) => {
    if (!email) return false;
    return managers.some(manager => 
      manager.email.toLowerCase() === email.toLowerCase()
    );
  }, [managers]);

  const handleAddManager = async () => {
    if (!newManagerEmail.trim()) {
      showSnackbar('Please enter an email address', 'error');
      return;
    }
    
    const isApprovedUser = approvedUsers.some(
      user => user.email.toLowerCase() === newManagerEmail.toLowerCase()
    );
    
    if (!isApprovedUser) {
      showSnackbar('Only approved users can be added as managers', 'error');
      return;
    }
    
    if (isAlreadyManager(newManagerEmail)) {
      showSnackbar('This user is already a manager', 'info');
      return;
    }
    
    try {
      await addManager(newManagerEmail);
      showSnackbar(`${newManagerEmail} added as a manager`, 'success');
      setNewManagerEmail('');
      fetchManagers();
    } catch (error) {
      console.error('Error adding manager:', error);
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  const handleRemoveManager = async (email) => {
    try {
      await removeManager(email);
      showSnackbar(`${email} removed from managers`, 'success');
      fetchManagers();
    } catch (error) {
      console.error('Error removing manager:', error);
      showSnackbar(`Error: ${error.message}`, 'error');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
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

        {request.status === 'approved' && request.accessLevel && (
          <Typography variant="body2" sx={{ mt: 1, textTransform: 'capitalize', color: 'info.main' }}>
            Access: <strong>{request.accessLevel}</strong>
          </Typography>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', mt: 2, pt: 2, borderTop: '1px solid #eaeaea', gap: 1, flexWrap: 'wrap' }}>
        {request.status === 'pending' && (
          <>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ flexGrow: 1 }}
              onClick={() => initiateUserAction(request, 'approve')}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              sx={{ flexGrow: 1 }}
              onClick={() => initiateUserAction(request, 'reject')}
            >
              Reject
            </Button>
          </>
        )}
        {request.status === 'approved' && (
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<EditIcon />}
            sx={{ flexGrow: 1 }}
            onClick={() => initiateUserAction(request, 'changeAccess')}
          >
            Change Access
          </Button>
        )}
        <Button
          variant="text"
          size="small"
          onClick={() => openUserDetails(request)}
          sx={{ flexGrow: 1 }}
        >
          Details
        </Button>
        <Button
          variant="text"
          color="error"
          size="small"
          onClick={() => initiateUserAction(request, 'delete')}
          startIcon={<DeleteIcon />}
          sx={{ flexGrow: 1 }}
        >
          Delete
        </Button>
      </Box>
    </Paper>
  );
  
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
        {request.status === 'approved' && request.accessLevel ? (
          <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'info.dark' }}>
            {request.accessLevel} Access
          </Typography>
        ) : request.status === 'pending' ? (
          <Typography variant="caption" color="text.secondary">
            Pending Access Assignment
          </Typography>
        ) : null}
      </TableCell>
      <TableCell>
        {request.status === 'pending' && (
          <>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ mr: 1 }}
              onClick={() => initiateUserAction(request, 'approve')}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => initiateUserAction(request, 'reject')}
            >
              Reject
            </Button>
          </>
        )}
        {request.status === 'approved' && (
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
            onClick={() => initiateUserAction(request, 'changeAccess')}
          >
            Change Access
          </Button>
        )}
        <Button
          variant="text"
          size="small"
          sx={{ ml: (request.status === 'pending' || request.status === 'approved') ? 1 : 0 }}
          onClick={() => openUserDetails(request)}
        >
          Details
        </Button>
        <Button
          variant="text"
          color="error"
          size="small"
          sx={{ ml: 1 }}
          onClick={() => initiateUserAction(request, 'delete')}
          startIcon={<DeleteIcon />}
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
  
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

              {selectedUser.status === 'approved' && selectedUser.accessLevel && (
                <>
                  <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Access Level
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {selectedUser.accessLevel}
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
                    initiateUserAction(selectedUser, 'approve');
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
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="text"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  setDialogOpen(false);
                  initiateUserAction(selectedUser, 'delete');
                }}
              >
                Delete User
              </Button>
            </Box>
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
    
    React.useEffect(() => {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }, []);
  
    const handleConfirmClick = () => {
      if (!localPassword) return;
      handleConfirmAction(localPassword);
    };
  
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && localPassword && !confirmLoading) {
        e.preventDefault();
        handleConfirmClick();
      }
    };

    const getActionText = () => {
      switch (actionType) {
        case 'approve': return 'approve';
        case 'reject': return 'reject';
        case 'delete': return 'delete';
        case 'changeAccess': return 'change access level for';
        default: return 'process';
      }
    };

    const getActionColor = () => {
      switch (actionType) {
        case 'approve': return 'primary';
        case 'reject': case 'delete': return 'error';
        case 'changeAccess': return 'secondary';
        default: return 'primary';
      }
    };

    const getButtonText = () => {
        switch (actionType) {
            case 'approve': return 'Approve';
            case 'reject': return 'Reject';
            case 'delete': return 'Delete';
            case 'changeAccess': return 'Update Access';
            default: return 'Confirm';
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
            Please enter your password to {getActionText()}:
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 600 }}>
            {userToAction?.email || 'Loading user...'}
          </Typography>

          <Box sx={{ my: 2, minHeight: (actionType === 'approve' || actionType === 'changeAccess') ? '70px' : '0px' }}>
            {(actionType === 'approve' || actionType === 'changeAccess') && (
              <FormControl component="fieldset">
                <FormLabel component="legend">
                  {actionType === 'approve' ? 'Assign Access Level *' : 'New Access Level *'}
                </FormLabel>
                <RadioGroup
                  row
                  aria-label="access-level"
                  name="access-level-group"
                  value={selectedAccessLevel}
                  onChange={(e) => setSelectedAccessLevel(e.target.value)}
                >
                  <FormControlLabel value="shipping" control={<Radio />} label="Shipping" />
                  <FormControlLabel value="training" control={<Radio />} label="Training" />
                  <FormControlLabel value="both" control={<Radio />} label="Both" />
                </RadioGroup>
              </FormControl>
            )}
          </Box>

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
            color={getActionColor()}
            onClick={handleConfirmClick}
            disabled={!localPassword || confirmLoading || ((actionType === 'approve' || actionType === 'changeAccess') && !selectedAccessLevel)}
            sx={{ ml: 1, minWidth: '120px' }}
          >
            {confirmLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                <span>Verifying</span>
              </Box>
            ) : (
              getButtonText()
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
          <Tab 
            label="Managers" 
            sx={{ py: 2 }} 
          />
        </Tabs>
      </Paper>

      {tabValue !== 3 && (
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
      )}

      {tabValue === 3 ? (
        <Box>
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Add New Manager</Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2 
            }}>
              <Autocomplete
                fullWidth
                options={approvedUsers.filter(user => !isAlreadyManager(user.email))}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.email;
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body1">
                        {option.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.name}
                      </Typography>
                    </Box>
                  </Box>
                )}
                value={newManagerEmail}
                onChange={(event, newValue) => {
                  setNewManagerEmail(newValue ? newValue.email : '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Manager Email"
                    placeholder="Select from approved users"
                  />
                )}
              />
              <Button
                variant="contained"
                onClick={handleAddManager}
                disabled={!newManagerEmail.trim()}
                sx={{ 
                  whiteSpace: 'nowrap',
                  minWidth: { xs: '100%', sm: '120px' }
                }}
              >
                Add Manager
              </Button>
            </Box>
          </Paper>

          <Typography variant="h6" sx={{ mb: 2 }}>Current Managers</Typography>
          {managers.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No managers found</Typography>
            </Paper>
          ) : (
            managers.map((manager) => (
              <Paper 
                key={manager.email}
                elevation={1}
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body1">{manager.email}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Added by {manager.addedBy} on {new Date(manager.addedAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleRemoveManager(manager.email)}
                  size="small"
                  startIcon={<DeleteIcon />}
                >
                  Remove
                </Button>
              </Paper>
            ))
          )}
        </Box>
      ) : (
        isMobile ? (
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Request Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Access Level</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No {tabValue === 0 ? 'pending' : tabValue === 1 ? 'approved' : 'rejected'} requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map(renderTableRow)
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      <UserDetailsDialog />
      <PasswordConfirmDialog />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          severity={snackbarSeverity} 
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminVerification;

