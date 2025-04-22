import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box
} from '@mui/material';
import SignaturePad from 'react-signature-canvas';

const SignatureDialog = ({ open, onClose, onSave, title }) => {
  const sigPadRef = useRef(null);

  const handleSave = () => {
    if (sigPadRef.current) {
      // Check if the signature pad is empty before saving
      if (sigPadRef.current.isEmpty()) {
        alert("Please provide a signature before saving.");
        return;
      }
      const signatureData = sigPadRef.current.toDataURL();
      onSave(signatureData);
      onClose(); // Close dialog after saving
    }
  };

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
  };

  // Ensure the pad clears when the dialog reopens
  React.useEffect(() => {
    if (open && sigPadRef.current) {
      sigPadRef.current.clear();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title || 'Add Signature'}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            border: '1px solid #ccc',
            borderRadius: 1,
            mt: 2,
            backgroundColor: '#fff', // Ensure background is white for signature visibility
            position: 'relative', // Needed for potential overlay elements if added later
            width: '100%', // Ensure it takes full width of dialog content
            height: 200, // Fixed height for the canvas container
            overflow: 'hidden' // Hide any overflow
          }}
        >
          <SignaturePad
            ref={sigPadRef}
            canvasProps={{
              // Adjust canvas size slightly smaller than container to avoid scrollbars if needed
              // Or use CSS to make it responsive within the container
              style: { width: '100%', height: '100%' },
              className: 'signature-canvas' // Add class if you have specific CSS
            }}
            // Optional: Set pen color and background color if needed
            // penColor='black'
            // backgroundColor='white'
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClear} color="secondary">
          Clear
        </Button>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Signature
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignatureDialog;
