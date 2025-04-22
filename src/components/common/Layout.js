import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { collection, query, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { testDb } from '../../firebase/testConfig';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const accessLevel = localStorage.getItem('accessLevel'); // Get access level for Sidebar

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Add cleanup function for test users
  useEffect(() => {
    // This function will clean up test data when the component unmounts (user logs out)
    return () => {
      const cleanupTestData = async () => {
        const isTestUser = localStorage.getItem('isTestUser') === 'true';
        if (isTestUser) {
          try {
            // Clean up test SOPs
            const sopsQuery = query(collection(testDb, 'test_sops'));
            const sopsSnapshot = await getDocs(sopsQuery);
            
            const deletePromises = sopsSnapshot.docs.map(docSnap => 
              deleteDoc(doc(testDb, 'test_sops', docSnap.id))
            );
            
            await Promise.all(deletePromises);
            console.log('Test user SOPs cleaned up successfully');
          } catch (error) {
            console.error('Error cleaning up test user data:', error);
          }
        }
      };
      
      cleanupTestData();
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuClick={handleSidebarToggle} />
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        accessLevel={accessLevel} // Pass accessLevel to Sidebar
      />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          mt: '64px' // Adjust based on Header height
        }}
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
