import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Popper,
  Grow,
  Paper,
  MenuList,
  Collapse,
  Badge
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ScienceIcon from '@mui/icons-material/Science';
import InventoryIcon from '@mui/icons-material/Inventory';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { auth, db } from '../../firebase/config';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { testDb, testAuth } from '../../firebase/testConfig';
import { isManager } from '../../utils/userRoles';
import { clearTestUserDataAndAccount } from '../../utils/testUserData';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState(null);
  const [adminSubMenuExpanded, setAdminSubMenuExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [shipmentMenuOpen, setShipmentMenuOpen] = useState(false);
  const [shipmentMenuAnchor, setShipmentMenuAnchor] = useState(null);
  const [shipmentSubMenuExpanded, setShipmentSubMenuExpanded] = useState(false);
  const isTrainingSystem = location.pathname.startsWith('/training') || 
                          location.search.includes('system=training');
  const isShipping = !isTrainingSystem;
  const [isUserManager, setIsUserManager] = useState(false);
  const [pendingTrainingCount, setPendingTrainingCount] = useState(0);
  const [userAccessLevel, setUserAccessLevel] = useState('both');

  useEffect(() => {
    const checkAdmin = () => {
      const storedAdmin = localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(storedAdmin);
    };

    const getUserName = async () => {
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      const user = isTestUser ? testAuth.currentUser : auth.currentUser;
      
      if (user) {
        if (isTestUser) {
          setUserName(user.email.split('@')[0]);
        } else {
          const userQuery = query(
            collection(db, 'userRequests'),
            where('email', '==', user.email),
            where('status', '==', 'approved')
          );
          try {
            const querySnapshot = await getDocs(userQuery);
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              setUserName(userData.name || user.email.split('@')[0]);
            } else {
              setUserName(user.email.split('@')[0]);
            }
          } catch (error) {
            console.error('Error fetching user name:', error);
            setUserName(user.email.split('@')[0]);
          }
        }
      }
    };

    checkAdmin();
    getUserName();

    const storedAccessLevel = localStorage.getItem('accessLevel') || 'both';
    setUserAccessLevel(storedAccessLevel);
  }, []);

  useEffect(() => {
    const checkManagerStatus = async () => {
      try {
        const managerStatus = await isManager();
        setIsUserManager(managerStatus);
      } catch (error) {
        console.error("Error checking manager status in Header:", error);
      }
    };

    checkManagerStatus();

    let unsubscribe = () => {};
    const setupListener = async () => {
      const managerStatus = await isManager();
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      if (managerStatus || isAdmin) {
        const authInstance = localStorage.getItem('isTestUser') === 'true' ? testAuth : auth;
        const user = authInstance.currentUser;
        if (!user) return;
        const dbInstance = localStorage.getItem('isTestUser') === 'true' ? testDb : db;
        const collectionName = localStorage.getItem('isTestUser') === 'true' ? 'test_selfTrainings' : 'selfTrainings';
        const q = query(
          collection(dbInstance, collectionName),
          where('status', '==', 'pending')
        );
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const count = querySnapshot.docs.filter(doc => doc.data().userId !== user.uid).length;
          setPendingTrainingCount(count);
        }, (error) => {
          console.error("Error listening to pending training count:", error);
        });
      }
    };
    setupListener();
    return () => unsubscribe();
  }, []);

  const resetAllMenus = useCallback(() => {
    setShipmentSubMenuExpanded(false);
    setAdminSubMenuExpanded(false);
    setShipmentMenuOpen(false);
    setAdminMenuOpen(false);
    setShipmentMenuAnchor(null);
    setAdminMenuAnchor(null);
  }, []);

  const handleDrawerToggle = () => {
    if (drawerOpen) {
      resetAllMenus();
    }
    setDrawerOpen(!drawerOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    const isTestUser = localStorage.getItem('isTestUser') === 'true';
    const authInstance = isTestUser ? testAuth : auth;

    try {
      if (isTestUser) {
        console.log("Logging out test user and clearing data...");
        await clearTestUserDataAndAccount();
        console.log("Test user data and account cleared.");
      } else {
        console.log("Logging out regular user...");
        await authInstance.signOut();
      }
      localStorage.removeItem('userName');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('isTestUser');
      localStorage.removeItem('adminEmail');
      handleUserMenuClose();
      navigate('/');
      console.log("Logout successful, navigated to login.");

    } catch (error) {
      console.error('Logout failed:', error);
      alert(`Logout failed: ${error.message}`);
      try {
        await authInstance.signOut();
      } catch (signOutError) {
        console.error('Fallback sign-out failed:', signOutError);
      }
      localStorage.clear();
      navigate('/');
    }
  };

  const shippingNavigationItems = [
    { 
      title: 'Dashboard', 
      path: '/dashboard',
      icon: <DashboardIcon />
    },
    { 
      title: 'Shipment', 
      path: '/shipment',
      icon: <LocalShippingIcon />,
      subItems: [
        {
          title: 'Create Shipment',
          path: '/shipping-form',
          icon: <AddIcon fontSize="small" />
        },
        {
          title: 'View Shipments',
          path: '/records',
          icon: <ListAltIcon fontSize="small" />
        }
      ]
    },
    { 
      title: 'Manufacturing', 
      path: '/manufacturing',
      icon: <ScienceIcon /> 
    },
    { 
      title: 'Item Master', 
      path: '/item-master', 
      icon: <InventoryIcon /> 
    },
  ];

  const trainingNavigationItems = [
    {
      title: 'Training Dashboard',
      path: '/training',
      icon: <DashboardIcon />
    },
    {
      title: 'My Trainings',
      path: '/training/records',
      icon: <HistoryIcon />
    },
    {
      title: 'Self Training',
      path: '/training/self-training-form',
      icon: <AssignmentIcon />
    },
    ...(isAdmin || isUserManager ? [
      {
        title: 'In-Class Training',
        path: '/training/in-class-training-form',
        icon: <GroupIcon />
      },
      {
        title: 'Approve Training',
        path: '/training/approve',
        icon: <PlaylistAddCheckIcon />,
        badgeCount: pendingTrainingCount
      },
      {
        title: 'All Training Records',
        path: '/training/all-records',
        icon: <ListAltIcon />
      }
    ] : [])
  ];

  const currentNavigationItems = isTrainingSystem ? trainingNavigationItems : shippingNavigationItems;

  const adminSubmenuItems = [
    {
      title: 'Pending',
      path: '/admin/verify?tab=0',
      icon: <AccessTimeIcon fontSize="small" />
    },
    {
      title: 'Approved',
      path: '/admin/verify?tab=1',
      icon: <CheckCircleIcon fontSize="small" />
    },
    {
      title: 'Rejected',
      path: '/admin/verify?tab=2',
      icon: <CancelIcon fontSize="small" />
    },
    {
      title: 'Managers',
      path: '/admin/verify?tab=3',
      icon: <GroupsIcon fontSize="small" />
    }
  ];

  const handleAdminHover = (event) => {
    if (isAdmin) {
      setAdminMenuAnchor(event.currentTarget);
      setAdminMenuOpen(true);
    }
  };

  const handleAdminLeave = () => {
    setAdminMenuOpen(false);
  };

  const handleAdminClick = () => {
    const adminPath = `/admin/verify?tab=0&system=${isTrainingSystem ? 'training' : 'shipping'}`;
    navigate(adminPath);
    setAdminMenuOpen(false);
    setAdminMenuAnchor(null);
  };

  const handleAdminMenuItemClick = (path) => {
    const tabQuery = path.split('?')[1];
    navigate(`/admin/verify?${tabQuery}&system=${isTrainingSystem ? 'training' : 'shipping'}`);
    setAdminMenuOpen(false);
    setAdminMenuAnchor(null);
  };

  const toggleAdminSubmenu = (event) => {
    event.stopPropagation();
    setAdminSubMenuExpanded(!adminSubMenuExpanded);
    if (!adminSubMenuExpanded) {
      setShipmentSubMenuExpanded(false);
      setShipmentMenuOpen(false);
      setAdminMenuOpen(false);
      setShipmentMenuAnchor(null);
      setAdminMenuAnchor(null);
    }
  };

  const handleShipmentHover = (event) => {
    setShipmentMenuAnchor(event.currentTarget);
    setShipmentMenuOpen(true);
  };

  const handleShipmentLeave = () => {
    setShipmentMenuOpen(false);
  };

  const handleShipmentClick = () => {
    navigate('/shipment');
    setShipmentMenuOpen(false);
    setShipmentMenuAnchor(null);
  };

  const handleShipmentMenuItemClick = (path) => {
    navigate(path);
    setShipmentMenuOpen(false);
    setShipmentMenuAnchor(null);
  };

  const toggleShipmentSubmenu = (event) => {
    event.stopPropagation();
    setShipmentSubMenuExpanded(!shipmentSubMenuExpanded);
    if (!shipmentSubMenuExpanded) {
      setAdminSubMenuExpanded(false);
      setShipmentMenuOpen(false);
      setAdminMenuOpen(false);
      setShipmentMenuAnchor(null);
      setAdminMenuAnchor(null);
    }
  };

  const handleDrawerItemClick = (path) => {
    setDrawerOpen(false);
    resetAllMenus();
    setTimeout(() => {
      if (path.startsWith('/admin/verify') || path.includes('tab=')) {
        if (isTrainingSystem) {
          if (!path.includes('system=')) {
            const separator = path.includes('?') ? '&' : '?';
            navigate(`${path}${separator}system=training`);
            return;
          }
        }
      }
      navigate(path);
    }, 0);
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        p: 2,
        mt: '56px',
        '@media (min-width:600px)': {
          mt: '64px',
        }
      }}>
        <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mb: 1, width: 56, height: 56 }}>
          {userName.charAt(0).toUpperCase()}
        </Avatar>
        <Typography variant="h6">{userName}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {isAdmin ? 'Administrator' : 'User'}
        </Typography>
      </Box>
      <Divider />
      <List>
        {currentNavigationItems.map((item) => {
          if (item.subItems) {
            const isActive = location.pathname === item.path || item.subItems.some(sub => location.pathname === sub.path);
            const isExpanded = item.title === 'Shipment' ? shipmentSubMenuExpanded : false;
            const toggleSubmenu = item.title === 'Shipment' ? toggleShipmentSubmenu : () => {};

            return (
              <React.Fragment key={item.path}>
                <ListItem
                  button
                  onClick={toggleSubmenu}
                  sx={{
                    bgcolor: isActive ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 'bold' : 'regular',
                      color: isActive ? 'primary.main' : 'text.primary'
                    }}
                  />
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItem>
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 4 }}>
                    {item.subItems.map((subItem) => {
                      const isSubActive = location.pathname === subItem.path;
                      return (
                        <ListItem
                          button
                          key={subItem.path}
                          onClick={() => handleDrawerItemClick(subItem.path)}
                          sx={{
                            py: 1,
                            bgcolor: isSubActive ? 'action.selected' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <ListItemIcon sx={{ color: isSubActive ? 'primary.main' : 'text.secondary', minWidth: 36 }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={subItem.title}
                            primaryTypographyProps={{
                              fontSize: '0.9rem',
                              fontWeight: isSubActive ? 'medium' : 'regular',
                              color: isSubActive ? 'primary.main' : 'text.primary'
                            }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          const isActive = location.pathname === item.path;
          const isTrainingItem = item.path.includes('/training/');
          const isSpecialTrainingItem = [
            '/training/approve', 
            '/training/records',
            '/training/all-records',
            '/training/self-training-form',
            '/training/in-class-training-form'
          ].includes(item.path);

          return (
            <ListItem
              button
              key={item.path}
              onClick={() => handleDrawerItemClick(item.path)}
              sx={{
                bgcolor: isActive ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
                py: isSpecialTrainingItem ? 1.5 : (isTrainingItem ? 1.2 : undefined),
                borderBottom: isTrainingItem ? '1px solid rgba(0,0,0,0.08)' : 'none',
                ...(isSpecialTrainingItem && {
                  my: 0.5,
                  borderRadius: 1,
                  boxShadow: isActive ? '0 0 0 1px rgba(25, 118, 210, 0.12)' : 'none',
                }),
              }}
            >
              <ListItemIcon sx={{ 
                color: isActive ? 'primary.main' : 'text.secondary',
                minWidth: isSpecialTrainingItem ? 46 : (isTrainingItem ? 42 : 36),
                '& .MuiSvgIcon-root': {
                  fontSize: isSpecialTrainingItem ? '1.5rem' : undefined,
                }
              }}>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <Badge 
                    badgeContent={item.badgeCount} 
                    color="error"
                    sx={{ 
                      '& .MuiBadge-badge': { 
                        fontSize: '0.7rem',
                        height: 18,
                        minWidth: 18,
                        top: 2,
                        right: -4
                      } 
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText
                primary={item.title}
                primaryTypographyProps={{
                  fontWeight: isActive ? 'bold' : (isSpecialTrainingItem ? 'medium' : 'regular'),
                  color: isActive ? 'primary.main' : 'text.primary',
                  fontSize: isSpecialTrainingItem ? '1rem' : (isTrainingItem ? '0.95rem' : undefined)
                }}
              />
            </ListItem>
          );
        })}

        {isAdmin && (
          <>
            <ListItem
              button
              onClick={toggleAdminSubmenu}
              sx={{
                bgcolor: location.pathname === '/admin/verify' ? 'action.selected' : 'transparent',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === '/admin/verify' ? 'primary.main' : 'text.secondary' }}>
                <SupervisorAccountIcon />
              </ListItemIcon>
              <ListItemText
                primary="User Management"
                primaryTypographyProps={{
                  fontWeight: 'bold',
                  color: location.pathname === '/admin/verify' ? 'primary.main' : 'text.primary'
                }}
              />
              {adminSubMenuExpanded ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={adminSubMenuExpanded} timeout="auto" unmountOnExit>
              <List component="div" disablePadding sx={{ pl: 4 }}>
                {adminSubmenuItems.map((item) => {
                  const isActive = location.pathname === '/admin/verify' && location.search.includes(`tab=${item.path.split('=')[1]}`);
                  return (
                    <ListItem
                      button
                      key={item.path}
                      onClick={() => handleDrawerItemClick(item.path)}
                      sx={{
                        py: 1,
                        bgcolor: isActive ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'text.secondary', minWidth: 36 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isActive ? 'medium' : 'regular',
                          color: isActive ? 'primary.main' : 'text.primary'
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
          </>
        )}

        {userAccessLevel === 'both' && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItem
              button
              onClick={() => {
                handleDrawerItemClick(isTrainingSystem ? '/dashboard' : '/training');
              }}
            >
              <ListItemIcon sx={{ color: 'secondary.main' }}>
                {isTrainingSystem ? <BusinessCenterIcon /> : <SchoolIcon />}
              </ListItemIcon>
              <ListItemText
                primary={isTrainingSystem ? 'Shipping System' : 'Training System'}
                primaryTypographyProps={{ color: 'secondary.main' }}
              />
            </ListItem>
          </>
        )}

        <ListItem button onClick={handleLogout}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout"
            primaryTypographyProps={{
              color: 'error.main',
            }}
          />
        </ListItem>
      </List>
    </Box>
  );

  useEffect(() => {
    resetAllMenus();
  }, [location.pathname, resetAllMenus]);

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, borderRadius: 0 }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate(isTrainingSystem ? '/training' : '/dashboard')}>
            {isTrainingSystem ? 'Training System' : 'PM Management'}
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {currentNavigationItems.map((item) => {
                if (item.subItems) {
                  const isActive = item.path === location.pathname || 
                    item.subItems.some(subItem => subItem.path === location.pathname);
                  
                  return (
                    <React.Fragment key={item.path}>
                      <Button
                        color="inherit"
                        onClick={handleShipmentClick}
                        onMouseEnter={handleShipmentHover}
                        onMouseLeave={handleShipmentLeave}
                        sx={{ 
                          mx: 1, 
                          fontWeight: isActive ? 'bold' : 'regular',
                          borderBottom: isActive ? '2px solid white' : 'none',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: 0
                          }
                        }}
                      >
                        {item.title}
                      </Button>
                      
                      <Popper
                        open={shipmentMenuOpen}
                        anchorEl={shipmentMenuAnchor}
                        placement="bottom-start"
                        transition
                        disablePortal
                        sx={{ zIndex: theme.zIndex.drawer + 2 }}
                      >
                        {({ TransitionProps, placement }) => (
                          <Grow
                            {...TransitionProps}
                            style={{ transformOrigin: 'top left' }}
                          >
                            <Paper 
                              elevation={3}
                              sx={{ mt: 1, minWidth: 180 }}
                              onMouseEnter={() => setShipmentMenuOpen(true)}
                              onMouseLeave={handleShipmentLeave}
                            >
                              <MenuList autoFocusItem={false}>
                                {item.subItems.map((subItem) => (
                                  <MenuItem
                                    key={subItem.path}
                                    onClick={() => handleShipmentMenuItemClick(subItem.path)}
                                    sx={{ 
                                      minHeight: 42,
                                      '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                      {subItem.icon}
                                    </ListItemIcon>
                                    <ListItemText>
                                      {subItem.title}
                                    </ListItemText>
                                  </MenuItem>
                                ))}
                              </MenuList>
                            </Paper>
                          </Grow>
                        )}
                      </Popper>
                    </React.Fragment>
                  );
                }
                
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    color="inherit"
                    onClick={() => navigate(item.path)}
                    sx={{ 
                      mx: 1, 
                      fontWeight: isActive ? 'bold' : 'regular',
                      borderBottom: isActive ? '2px solid white' : 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 1
                      }
                    }}
                    startIcon={
                      item.badgeCount && item.badgeCount > 0 ? (
                        <Badge badgeContent={item.badgeCount} color="error" overlap="circular">
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )
                    }
                  >
                    {item.title}
                  </Button>
                );
              })}
              
              {isAdmin && (
                <>
                  <Button
                    color="inherit"
                    onClick={handleAdminClick}
                    onMouseEnter={handleAdminHover}
                    onMouseLeave={handleAdminLeave}
                    sx={{ 
                      mx: 1, 
                      fontWeight: location.pathname === '/admin/verify' ? 'bold' : 'regular',
                      borderBottom: location.pathname === '/admin/verify' ? '2px solid white' : 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 0
                      }
                    }}
                    startIcon={<SupervisorAccountIcon />}
                  >
                    User Management
                  </Button>
                  <Popper
                    open={adminMenuOpen}
                    anchorEl={adminMenuAnchor}
                    placement="bottom-start"
                    transition
                    disablePortal
                    sx={{ zIndex: theme.zIndex.drawer + 2 }}
                  >
                    {({ TransitionProps, placement }) => (
                      <Grow
                        {...TransitionProps}
                        style={{ transformOrigin: 'top left' }}
                      >
                        <Paper 
                          elevation={3} 
                          sx={{ mt: 1, minWidth: 180 }}
                          onMouseEnter={() => setAdminMenuOpen(true)}
                          onMouseLeave={handleAdminLeave}
                        >
                          <MenuList autoFocusItem={false}>
                            {adminSubmenuItems.map((item) => (
                              <MenuItem
                                key={item.path}
                                onClick={() => handleAdminMenuItemClick(item.path)}
                                sx={{ 
                                  minHeight: 42,
                                  '&:hover': { bgcolor: 'action.hover' }
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  {item.icon}
                                </ListItemIcon>
                                <ListItemText>
                                  {item.title}
                                </ListItemText>
                              </MenuItem>
                            ))}
                          </MenuList>
                        </Paper>
                      </Grow>
                    )}
                  </Popper>
                </>
              )}

              {userAccessLevel === 'both' && (
                <>
                  {isShipping && (
                    <Button
                      color="inherit"
                      onClick={() => navigate('/training')}
                      sx={{ ml: 1 }}
                      startIcon={<ArrowForwardIcon />}
                    >
                      Go to Training
                    </Button>
                  )}
                  {isTrainingSystem && (
                    <Button
                      color="inherit"
                      onClick={() => navigate('/dashboard')}
                      sx={{ ml: 1 }}
                      startIcon={<ArrowBackIcon />}
                    >
                      Go to Shipping
                    </Button>
                  )}
                </>
              )}
            </Box>
          )}
          <Box>
            <IconButton
              color="inherit"
              onClick={handleUserMenuOpen}
              aria-label="user account"
              aria-controls="user-menu"
              aria-haspopup="true"
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'rgba(255, 255, 255, 0.15)'
                } 
              }}
            >
              <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 32, height: 32 }}>
                {userName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="user-menu"
              anchorEl={userMenuAnchor}
              keepMounted
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleUserMenuClose} disabled>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={userName}
                  secondary={isAdmin ? 'Admin Account' : 'User Account'}
                />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout"
                  primaryTypographyProps={{ color: 'error.main' }} 
                />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': { width: 250 },
          '& .MuiBackdrop-root': { zIndex: theme.zIndex.drawer - 1 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
