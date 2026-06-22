import { CircularProgress, Box } from '@mui/material';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: number;
}

const LoadingSpinner = ({ fullScreen = false, size = 40 }: LoadingSpinnerProps) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={fullScreen ? '100vh' : 200}
      width="100%"
    >
      <CircularProgress size={size} />
    </Box>
  );
};

export default LoadingSpinner;
