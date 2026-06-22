import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import UpcomingIcon from '@mui/icons-material/Upcoming';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { DashboardStats } from '../types';

interface DashboardCardsProps {
  stats: DashboardStats | null;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const StatCard = ({ title, value, icon, color, bgColor }: StatCardProps) => (
  <Card
    sx={{
      height: '100%',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-4px)' },
    }}
  >
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: bgColor,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardCards = ({ stats }: DashboardCardsProps) => {
  const cards = [
    {
      title: 'Total Appointments',
      value: stats?.total ?? 0,
      icon: <EventIcon />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Upcoming Meetings',
      value: stats?.upcoming ?? 0,
      icon: <UpcomingIcon />,
      color: '#ed6c02',
      bgColor: '#fff3e0',
    },
    {
      title: "Today's Appointments",
      value: stats?.today ?? 0,
      icon: <EventIcon />,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
    },
    {
      title: 'Completed Meetings',
      value: stats?.completed ?? 0,
      icon: <CheckCircleIcon />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Cancelled Meetings',
      value: stats?.cancelled ?? 0,
      icon: <CancelIcon />,
      color: '#d32f2f',
      bgColor: '#ffebee',
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={card.title}>
          <StatCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardCards;
