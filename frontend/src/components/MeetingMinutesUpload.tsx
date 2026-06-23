import { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Stack,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Appointment } from '../types';
import { appointmentService } from '../services/appointmentService';

interface MeetingMinutesUploadProps {
  appointment: Appointment;
  onUpdated: (appointment: Appointment) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MeetingMinutesUpload = ({
  appointment,
  onUpdated,
}: MeetingMinutesUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (appointment.status !== 'Completed') {
    return null;
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a PDF file only.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('PDF file must be 10MB or smaller.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await appointmentService.uploadMeetingMinutes(appointment.id, file);
      onUpdated(updated);
      setSuccess('Meeting minutes uploaded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload meeting minutes');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async () => {
    if (!appointment.meetingMinutes) return;

    setIsDownloading(true);
    setError(null);

    try {
      await appointmentService.downloadMeetingMinutes(
        appointment.id,
        appointment.meetingMinutes.fileName
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download meeting minutes');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment.meetingMinutes) return;
    if (!window.confirm('Remove the uploaded meeting minutes PDF?')) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await appointmentService.deleteMeetingMinutes(appointment.id);
      onUpdated(updated);
      setSuccess('Meeting minutes removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meeting minutes');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 3, borderRadius: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Meeting Minutes (PDF)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload the official meeting minutes after this meeting is completed.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {appointment.meetingMinutes ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            p: 2,
            bgcolor: 'action.hover',
            borderRadius: 1,
          }}
        >
          <PictureAsPdfIcon color="error" />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography fontWeight={500}>{appointment.meetingMinutes.fileName}</Typography>
            <Typography variant="caption" color="text.secondary">
              Uploaded {new Date(appointment.meetingMinutes.uploadedAt).toLocaleString()} ·{' '}
              {formatFileSize(appointment.meetingMinutes.fileSize)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={isDownloading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleDownload}
              disabled={isDownloading || isUploading || isDeleting}
            >
              Download
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={isUploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
            >
              Replace
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
              onClick={handleDelete}
              disabled={isDeleting || isUploading}
            >
              Remove
            </Button>
          </Stack>
        </Box>
      ) : (
        <Button
          variant="contained"
          startIcon={isUploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload PDF'}
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={handleFileSelect}
      />
    </Paper>
  );
};

export default MeetingMinutesUpload;
