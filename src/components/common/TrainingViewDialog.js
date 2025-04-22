import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Link,
  Divider
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

const TrainingViewDialog = ({ open, onClose, record }) => {

  if (!record) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) { return 'Invalid Date'; }
  };

  const isProcessed = record.status === 'approved' || record.status === 'rejected';
  const actorLabel = record.status === 'approved' ? 'Approver' : record.status === 'rejected' ? 'Rejecter' : 'Actor';
  const actionDateLabel = record.status === 'approved' ? 'Approval Date' : record.status === 'rejected' ? 'Rejection Date' : 'Action Date';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={window.innerWidth < 600} // Full screen on very small devices
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #ccc', 
        pb: 2,
        fontSize: { xs: '1.1rem', sm: '1.25rem' }
      }}>
        Training Record Details {record.id && `(ID: ${record.id})`}
      </DialogTitle>
      <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">SOP Number:</Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{record.sopNumber || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Revision:</Typography>
            <Typography variant="body1">{record.revision || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Trainee Name:</Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{record.traineeName || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Date Submitted:</Typography>
            <Typography variant="body1">{formatDate(record.submittedAt)}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Date Signed (Trainee):</Typography>
            <Typography variant="body1">{record.traineeDate || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status:</Typography>
            <Typography variant="body1" sx={{ 
              textTransform: 'capitalize', 
              color: record.status === 'pending' ? 'orange' : record.status === 'approved' ? 'green' : 'red',
              fontWeight: 'medium'
            }}>
              {record.status || 'Unknown'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary">Trainee Signature:</Typography>
            {record.traineeSign ? (
              <Box sx={{ 
                border: '1px solid #eee', 
                p: 1, 
                mt: 1, 
                display: 'inline-block',
                maxWidth: '100%',
                overflowX: 'auto'
              }}>
                <img 
                  src={record.traineeSign} 
                  alt="Trainee Signature" 
                  style={{ 
                    display: 'block', 
                    maxWidth: '100%', 
                    height: 'auto',
                    maxHeight: '120px'
                  }} 
                />
              </Box>
            ) : (
              <Typography variant="body1">No signature provided.</Typography>
            )}
          </Grid>

          {isProcessed && (
            <>
              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">{actorLabel} Name:</Typography>
                <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>{record.actorName || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">{actionDateLabel}:</Typography>
                <Typography variant="body1">{formatDate(record.processedAt)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">{actorLabel} Notes:</Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    whiteSpace: 'pre-wrap', 
                    mt: 0.5,
                    backgroundColor: '#f9f9f9',
                    p: 1,
                    borderRadius: 1,
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}
                >
                  {record.actionNotes || 'No notes provided.'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">{actorLabel} Signature:</Typography>
                {record.actionSign ? (
                  <Box sx={{ 
                    border: '1px solid #eee', 
                    p: 1, 
                    mt: 1, 
                    display: 'inline-block',
                    maxWidth: '100%',
                    overflowX: 'auto'
                  }}>
                    <img 
                      src={record.actionSign} 
                      alt={`${actorLabel} Signature`} 
                      style={{ 
                        display: 'block', 
                        maxWidth: '100%', 
                        height: 'auto',
                        maxHeight: '120px'
                      }} 
                    />
                  </Box>
                ) : (
                  <Typography variant="body1">No signature provided.</Typography>
                )}
              </Grid>
            </>
          )}

          {record.attachmentUrl && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary">Attachment:</Typography>
              <Link 
                href={record.attachmentUrl} 
                download={record.attachmentName || 'attachment.pdf'} 
                target="_blank" 
                rel="noopener noreferrer" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mt: 1,
                  wordBreak: 'break-all'
                }}
              >
                <DownloadIcon sx={{ mr: 1, flexShrink: 0 }} />
                <span>{record.attachmentName || 'Download Attachment'}</span>
              </Link>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'stretch' }}>
        <Button onClick={onClose} variant="contained" fullWidth={window.innerWidth < 600}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrainingViewDialog;
