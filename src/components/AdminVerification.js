import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Box
} from '@mui/material';
import { collection, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { sendEmail } from '../utils/emailService'; // Import email service

const AdminVerification = () => {
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'userRequests'));
      const users = querySnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .filter(user => user.status === 'pending');
      setPendingUsers(users);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    }
  };

  const handleApprove = async (user) => {
    try {
      const adminEmail = auth.currentUser.email;
      const adminPassword = await new Promise((resolve) => {
        const pwdPrompt = document.createElement('input');
        pwdPrompt.type = 'password';
        pwdPrompt.placeholder = 'Enter admin password';
        
        const dialog = document.createElement('div');
        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';
        dialog.style.backgroundColor = 'white';
        dialog.style.padding = '20px';
        dialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        dialog.style.zIndex = '1000';
        
        dialog.appendChild(pwdPrompt);
        
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit';
        submitBtn.onclick = () => {
          dialog.remove();
          resolve(pwdPrompt.value);
        };
        
        dialog.appendChild(submitBtn);
        document.body.appendChild(dialog);
        pwdPrompt.focus();
      });
      
      // Store admin status before signing out
      const isAdmin = localStorage.getItem('isAdmin');
      
      // First verify admin credentials before proceeding
      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        // Restore admin status immediately after re-authentication
        localStorage.setItem('isAdmin', isAdmin);
      } catch (error) {
        alert('Invalid admin password. Approval cancelled.');
        return; // Exit early if password verification fails
      }

      // Proceed with user approval only if admin password was correct
      const tempAuth = getAuth();
      const tempPassword = 'tempPassword123';
      
      try {
        const userCredential = await createUserWithEmailAndPassword(tempAuth, user.email, tempPassword);
        
        // Send email with temporary password
        await sendEmail({
          to: user.email,
          name: user.name,
          subject: 'Account Approved - Temporary Password',
          html: tempPassword,
        });

        // Create user document
        await setDoc(doc(db, 'usersData', userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: user.name,
          email: user.email,
          createdAt: new Date().toISOString(),
          isTestUser: false
        });

        // Update request status
        await updateDoc(doc(db, 'userRequests', user.id), {
          status: 'approved',
          uid: userCredential.user.uid,
          verificationSent: true,
          verificationSentAt: new Date().toISOString()
        });

        // Make sure we're still signed in as admin
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        localStorage.setItem('isAdmin', 'true');

        alert('User approved successfully. Email with temporary password sent.');
        fetchPendingUsers(); // Refresh the list
      } catch (error) {
        // If anything fails, make sure admin is still logged in
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        localStorage.setItem('isAdmin', 'true');
        throw error;
      }
    } catch (error) {
      console.error('Error in approval process:', error);
      alert(`Error approving user: ${error.message}`);
    }
  };

  const handleReject = async (user) => {
    if (window.confirm(`Are you sure you want to reject ${user.name}'s registration request?`)) {
      try {
        // First verify admin credentials
        const adminEmail = auth.currentUser.email;
        const adminPassword = await new Promise((resolve) => {
          const pwdPrompt = document.createElement('input');
          pwdPrompt.type = 'password';
          pwdPrompt.placeholder = 'Enter admin password';
          
          const dialog = document.createElement('div');
          dialog.style.position = 'fixed';
          dialog.style.top = '50%';
          dialog.style.left = '50%';
          dialog.style.transform = 'translate(-50%, -50%)';
          dialog.style.backgroundColor = 'white';
          dialog.style.padding = '20px';
          dialog.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
          dialog.style.zIndex = '1000';
          
          dialog.appendChild(pwdPrompt);
          
          const submitBtn = document.createElement('button');
          submitBtn.textContent = 'Submit';
          submitBtn.onclick = () => {
            dialog.remove();
            resolve(pwdPrompt.value);
          };
          
          dialog.appendChild(submitBtn);
          document.body.appendChild(dialog);
          pwdPrompt.focus();
        });

        // Verify admin password
        try {
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        } catch (error) {
          alert('Invalid admin password. Rejection cancelled.');
          return;
        }

        // Proceed with rejection after password verification
        await updateDoc(doc(db, 'userRequests', user.id), {
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectedBy: adminEmail
        });

        // Send rejection email
        try {
          await sendEmail({
            to: user.email,
            name: user.name,
            subject: 'Registration Request Status',
            html: 'Your registration request has been declined.'
          });
        } catch (emailError) {
          console.error('Error sending rejection email:', emailError);
        }

        alert('User registration rejected successfully.');
        fetchPendingUsers();
      } catch (error) {
        console.error('Error rejecting user:', error);
        alert(`Error rejecting user: ${error.message}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isAdmin');
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
      navigate('/');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 4 }}>
        <Typography variant="h4" sx={{mt: 2}}>User Verification Requests</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2, mt: 2 }}
          >
            Dashboard
          </Button>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ mt: 2 }}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Date Requested</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => handleApprove(user)}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => handleReject(user)}
                    >
                      Reject
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default AdminVerification;
