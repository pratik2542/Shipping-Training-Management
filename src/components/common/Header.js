import React, { useState, useEffect } from 'react';
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
  ClickAwayListener,
  MenuList
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
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { testAuth } from '../../firebase/testConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

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
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      handleUserMenuClose();
      const isTestUser = localStorage.getItem('isTestUser') === 'true';
      
      if (isTestUser) {
        await signOut(testAuth);
      } else {
        await signOut(auth);
      }
      
      localStorage.removeItem('isTestUser');
      localStorage.removeItem('isAdmin');
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/');
    }
  };

  // Updated Navigation Items - combining Create Shipment and View Records
  const navigationItems = [
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

  // Admin submenu items
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

  const handleAdminMenuClose = () => {
    setAdminMenuOpen(false);
  };

  const handleAdminClick = () => {
    // When user clicks User Management, go to pending tab
    navigate('/admin/verify?tab=0');
    setAdminMenuOpen(false);
  };

  // Add this function to handle menu item clicks
  const handleAdminMenuItemClick = (path) => {
    navigate(path);
    setAdminMenuOpen(false);
  };

  // Add this function to toggle the admin submenu in the drawer
  const toggleAdminSubmenu = (event) => {
    event.stopPropagation(); // Prevent parent click
    setAdminSubMenuExpanded(!adminSubMenuExpanded);
  };

  // Add state for shipment menu
  const [shipmentMenuOpen, setShipmentMenuOpen] = useState(false);
  const [shipmentMenuAnchor, setShipmentMenuAnchor] = useState(null);
  const [shipmentSubMenuExpanded, setShipmentSubMenuExpanded] = useState(false);

  const handleShipmentHover = (event) => {
    setShipmentMenuAnchor(event.currentTarget);
    setShipmentMenuOpen(true);
  };

  const handleShipmentMenuClose = () => {
    setShipmentMenuOpen(false);
  };

  const handleShipmentClick = () => {
    navigate('/shipment');
    setShipmentMenuOpen(false);
  };

  const handleShipmentMenuItemClick = (path) => {
    navigate(path);
    setShipmentMenuOpen(false);
  };

  const toggleShipmentSubmenu = (event) => {
    event.stopPropagation();
    setShipmentSubMenuExpanded(!shipmentSubMenuExpanded);
  };

  // Mobile drawer - show full expanded admin menu
  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        p: 2,
        bgcolor: 'primary.main',
        color: 'white',
        mt: '56px', // Add top margin to prevent hiding under AppBar
        '@media (min-width:600px)': {
          mt: '64px', // Adjust for larger screens
        },
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
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          // If the item has subitems, render differently
          if (item.subItems) {
            const isSubActive = item.subItems.some(subItem => 
              location.pathname === subItem.path
            );
            
            return (
              <React.Fragment key={item.path}>
                <ListItem
                  button
                  onClick={item.title === 'Shipment' ? toggleShipmentSubmenu : undefined}
                  sx={{ 
                    bgcolor: (isActive || isSubActive) ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: (isActive || isSubActive) ? 'primary.main' : 'text.secondary' 
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title} 
                    primaryTypographyProps={{
                      fontWeight: (isActive || isSubActive) ? 'bold' : 'regular',
                      color: (isActive || isSubActive) ? 'primary.main' : 'text.primary'
                    }}
                  />
                </ListItem>

                {/* Show subitems if expanded (only for Shipment) */}
                {item.title === 'Shipment' && shipmentSubMenuExpanded && (
                  <List sx={{ pl: 4 }}>
                    {item.subItems.map((subItem) => {
                      const isSubItemActive = location.pathname === subItem.path;
                      return (
                        <ListItem
                          button
                          key={subItem.path}
                          onClick={() => {
                            navigate(subItem.path);
                            setDrawerOpen(false);
                          }}
                          sx={{
                            py: 1,
                            bgcolor: isSubItemActive ? 'action.selected' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <ListItemIcon sx={{ 
                            color: isSubItemActive ? 'primary.main' : 'text.secondary',
                            minWidth: 36
                          }}>
                            {subItem.icon}
                          </ListItemIcon>
                          <ListItemText 
                            primary={subItem.title}
                            primaryTypographyProps={{
                              fontSize: '0.9rem',
                              fontWeight: isSubItemActive ? 'medium' : 'regular',
                              color: isSubItemActive ? 'primary.main' : 'text.primary'
                            }}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </React.Fragment>
            );
          }

          // Regular navigation item without subitems
          return (
            <ListItem 
              button 
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
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
            </ListItem>
          );
        })}
        
        {/* Admin section in drawer with nested items */}
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
            </ListItem>
            
            {/* Nested admin submenu items - only show when expanded */}
            {adminSubMenuExpanded && (
              <List sx={{ pl: 4 }}>
                {adminSubmenuItems.map((item) => {
                  const isActive = location.search.includes(`tab=${item.path.split('=')[1]}`);
                  return (
                    <ListItem
                      button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setDrawerOpen(false);
                      }}
                      sx={{
                        py: 1,
                        bgcolor: isActive ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon sx={{ 
                        color: isActive ? 'primary.main' : 'text.secondary',
                        minWidth: 36
                      }}>
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
            )}
          </>
        )}

        <Divider sx={{ my: 1 }} />
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

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            PM Management
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {navigationItems.map((item) => {
                // If item has subitems, render with dropdown
                if (item.subItems) {
                  const isActive = item.path === location.pathname || 
                    item.subItems.some(subItem => subItem.path === location.pathname);
                  
                  return (
                    <React.Fragment key={item.path}>
                      <Button 
                        color="inherit"
                        onClick={handleShipmentClick}
                        onMouseEnter={handleShipmentHover}
                        sx={{ 
                          mx: 1, 
                          fontWeight: isActive ? 'bold' : 'regular',
                          borderBottom: isActive ? '2px solid white' : 'none',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            borderRadius: 1
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
                            <Paper elevation={3} sx={{ mt: 1, minWidth: 180 }}>
                              <ClickAwayListener onClickAway={handleShipmentMenuClose}>
                                <MenuList autoFocusItem={shipmentMenuOpen} onMouseLeave={handleShipmentMenuClose}>
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
                              </ClickAwayListener>
                            </Paper>
                          </Grow>
                        )}
                      </Popper>
                    </React.Fragment>
                  );
                }
                
                // Regular navigation item
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
                  >
                    {item.title}
                  </Button>
                );
              })}
              
              {/* Admin menu with dropdown */}
              {isAdmin && (
                <>
                  <Button
                    color="inherit"
                    onClick={handleAdminClick} // Changed to go directly to pending tab
                    onMouseEnter={handleAdminHover}
                    sx={{ 
                      mx: 1, 
                      fontWeight: location.pathname === '/admin/verify' ? 'bold' : 'regular',
                      borderBottom: location.pathname === '/admin/verify' ? '2px solid white' : 'none',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 1
                      }
                    }}
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
                        <Paper elevation={3} sx={{ mt: 1, minWidth: 180 }}>
                          <ClickAwayListener onClickAway={handleAdminMenuClose}>
                            <MenuList autoFocusItem={adminMenuOpen} onMouseLeave={handleAdminMenuClose}>
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
                          </ClickAwayListener>
                        </Paper>
                      </Grow>
                    )}
                  </Popper>
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
                  backgroundColor: 'rgba(255, 255, 255, 0.15)' // Lighter hover for user icon
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
      <Toolbar /> {/* Add an empty Toolbar to create space */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          '& .MuiDrawer-paper': { width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Header;
