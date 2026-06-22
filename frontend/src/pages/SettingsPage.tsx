import { Box, Typography, Paper, Divider } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Settings
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 2, maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Profile
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary">
            Name
          </Typography>
          <Typography>{user?.name}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary">
            Email
          </Typography>
          <Typography>{user?.email}</Typography>
        </Box>
        <Box mb={2}>
          <Typography variant="caption" color="text.secondary">
            Role
          </Typography>
          <Typography>{user?.role}</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Telegram notifications are configured on the server. Contact your administrator
          to update notification settings.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
