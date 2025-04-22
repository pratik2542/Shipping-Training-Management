import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Input,
  IconButton
} from '@mui/material';
import SignatureDialog from './SignatureDialog'; // Re-use the signature dialog
import ClearIcon from '@mui/icons-material/Clear';

// Add 'mode' prop (default to 'approve')
const ApprovalDialog = ({ open, onClose, onSave, record, mode = 'approve' }) => {
  const [actionNotes, setActionNotes] = useState(''); // Renamed from approverNotes
  const [actionSign, setActionSign] = useState(''); // Renamed from approverSign
  const [actionDate, setActionDate] = useState(''); // Renamed from approverDate
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);

  const isApprovalMode = mode === 'approve';
  const actionVerb = isApprovalMode ? 'Approve' : 'Reject';
  const signatureTitle = `${actionVerb}r Signature`;

  useEffect(() => {
    // Reset state when dialog opens or record/mode changes
    if (open) {
      setActionNotes('');
      setActionSign('');
      setActionDate('');
      setNewAttachmentUrl('');
      setNewAttachmentName('');
    }
  }, [open, record, mode]);

  const handleSignatureClick = () => {
    setSignatureDialogOpen(true);
  };

  const handleSignatureSave = (signature) => {
    const currentDate = new Date().toISOString().split('T')[0];
    setActionSign(signature);
    setActionDate(currentDate);
    setSignatureDialogOpen(false);
  };

  const handleRemoveSignature = () => {
    setActionSign('');
    setActionDate('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation (optional)
      if (file.size > 1024 * 1024 * 2) { // Example: 2MB limit
        alert('File size should be less than 2MB');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setNewAttachmentUrl(reader.result);
        setNewAttachmentName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAttachment = () => {
    setNewAttachmentUrl('');
    setNewAttachmentName('');
    // Clear the file input visually if possible (difficult across browsers)
    const fileInput = document.getElementById('approval-attachment-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSaveClick = () => {
    // Signature is always required now
    if (!actionSign) {
      alert(`${signatureTitle} is required to ${actionVerb.toLowerCase()} this record.`);
      return;
    }
    onSave({
      notes: actionNotes, // Use generic 'notes'
      signature: actionSign, // Use generic 'signature'
      date: actionDate, // Use generic 'date'
      // Only include attachment if in approval mode
      ...(isApprovalMode && {
        attachmentUrl: newAttachmentUrl || record.attachmentUrl,
        attachmentName: newAttachmentName || record.attachmentName,
      }),
      mode: mode // Pass the mode back
    });
    onClose(); // Close dialog after saving
  };

  if (!record) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #ccc', pb: 2 }}>
          {actionVerb} Training Record (ID: {record.id}) {/* Dynamic Title */}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            SOP: {record.sopNumber} (Rev: {record.revision}) - Trainee: {record.traineeName}
          </Typography>

          <TextField
            label={`${actionVerb}r Notes (Optional)`} // Dynamic Label
            multiline
            rows={3}
            fullWidth
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            sx={{ my: 2 }}
          />

          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{signatureTitle} *</Typography> {/* Dynamic Label */}
            {actionSign ? (
              <Box>
                <Box sx={{ border: '1px solid #ccc', p: 1, mb: 1, display: 'inline-block' }}>
                  <img src={actionSign} alt={`${actionVerb}r Signature`} style={{ display: 'block', maxWidth: '300px', height: 'auto' }} /> {/* Dynamic Alt Text */}
                </Box>
                <Typography variant="caption" display="block">Signed on: {actionDate}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button variant="outlined" size="small" onClick={handleSignatureClick}>Change</Button>
                  <Button variant="outlined" size="small" color="error" onClick={handleRemoveSignature}>Remove</Button>
                </Box>
              </Box>
            ) : (
              <Button variant="outlined" onClick={handleSignatureClick}>Add Signature</Button>
            )}
          </Box>

          {/* Only show attachment section in approval mode */}
          {isApprovalMode && (
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Replace Attachment (Optional)</Typography>
              <Input
                id="approval-attachment-input"
                type="file"
                onChange={handleFileChange}
                fullWidth
              />
              {newAttachmentName && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  New: {newAttachmentName}
                  <IconButton size="small" onClick={handleRemoveAttachment}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Typography>
              )}
              {!newAttachmentName && record.attachmentName && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Current: {record.attachmentName}
                </Typography>
              )}
            </Box>
          )}

        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSaveClick} variant="contained" disabled={!actionSign} color={isApprovalMode ? 'primary' : 'error'}> {/* Dynamic Color */}
            Confirm {actionVerb} {/* Dynamic Text */}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Re-use SignatureDialog */}
      <SignatureDialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        onSave={handleSignatureSave}
        title={signatureTitle} // Dynamic Title
      />
    </>
  );
};

export default ApprovalDialog;
