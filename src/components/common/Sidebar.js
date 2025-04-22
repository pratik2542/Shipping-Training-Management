import React, { useEffect } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScienceIcon from '@mui/icons-material/Science';
import InventoryIcon from '@mui/icons-material/Inventory';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ApprovalIcon from '@mui/icons-material/Approval';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ClassIcon from '@mui/icons-material/Class';

// Define all possible menu items with access requirements
const allMenuItems = [
  // Shipping System Items
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', access: ['shipping', 'both'] },
  { text: 'Shipment', icon: <LocalShippingIcon />, path: '/shipment', access: ['shipping', 'both'] },
  { text: 'Manufacturing', icon: <ScienceIcon />, path: '/manufacturing', access: ['shipping', 'both'] },
  { text: 'Item Master', icon: <InventoryIcon />, path: '/item-master', access: ['shipping', 'both'] },

  // Training System Items
  { text: 'Training Dashboard', icon: <SchoolIcon />, path: '/training', access: ['training', 'both'] },
  { text: 'My Training Records', icon: <AssignmentIcon />, path: '/training/records', access: ['training', 'both'] },
  { text: 'Submit Self-Training', icon: <AssignmentIcon />, path: '/training/self-training-form', access: ['training', 'both'] },

  // Manager Only (Training) - Also require training or both access
  { text: 'Approve Training', icon: <ApprovalIcon />, path: '/training/approve', access: ['training', 'both'], managerOnly: true },
  { text: 'All Training Records', icon: <ListAltIcon />, path: '/training/all-records', access: ['training', 'both'], managerOnly: true },
  { text: 'Submit In-Class Training', icon: <ClassIcon />, path: '/training/in-class-training-form', access: ['training', 'both'], managerOnly: true },

  // Admin Only - Admins can see this regardless of their assigned accessLevel
  { text: 'Admin Verification', icon: <SupervisorAccountIcon />, path: '/admin/verify', access: ['shipping', 'training', 'both'], adminOnly: true },
];

const Sidebar = ({ open, onClose, accessLevel }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isUserManager = localStorage.getItem('isManager') === 'true';
  const isTestUser = localStorage.getItem('isTestUser') === 'true';
  
  // Debug log to track what's happening
  useEffect(() => {
    console.log("Sidebar rendered with access level:", accessLevel);
    console.log("Is admin:", isAdmin);
    console.log("Is manager:", isUserManager);
  }, [accessLevel, isAdmin, isUserManager]);

  // Filter items based on accessLevel, admin status, and manager status
  const filteredMenuItems = allMenuItems.filter(item => {
    // Always show all items to test users for testing purposes
    if (isTestUser) {
      return true;
    }

    // Special handling for Admin Verification: Always show if isAdmin is true
    if (item.text === 'Admin Verification' && isAdmin) {
      return true;
    }

    // For admins (excluding Admin Verification which is already handled): show everything except manager-only items if they aren't a manager
    if (isAdmin) {
      return !item.managerOnly || isUserManager;
    }

    // For regular users, apply strict access level filtering:
    
    // 1. First check admin-only items - regular users can't see these (Admin Verification handled above)
    if (item.adminOnly) {
      return false;
    }

    // 2. Check for matching access level
    const hasAccessLevel = accessLevel && item.access.includes(accessLevel);
    if (!hasAccessLevel) {
      return false;
    }

    // 3. For manager-only items, check if user is a manager
    if (item.managerOnly && !isUserManager) {
      return false;
    }

    // If all checks pass, show the item
    return true;
  });

  // Add debug output to console
  console.log("Filtered menu items:", filteredMenuItems.map(item => item.text));

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box
        sx={{ width: 250 }}
        role="presentation"
        onClick={onClose}
        onKeyDown={onClose}
      >
        <List>
          {filteredMenuItems.map((item) => (
            <ListItem button component={Link} to={item.path} key={item.text}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
