import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Outlet, useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/appointments': 'Appointments',
  '/calendar': 'Calendar',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/users': 'User Management',
};

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/appointments/new')) return 'New Appointment';
  if (pathname.includes('/edit')) return 'Edit Appointment';
  if (/^\/appointments\/[^/]+$/.test(pathname)) return 'View Appointment';
  return routeTitles[pathname] || 'Dashboard';
};

interface MainLayoutProps {
  title?: string;
}

const MainLayout = ({ title }: MainLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const pageTitle = title || getPageTitle(location.pathname);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Navbar
        onMenuClick={() => setMobileOpen(!mobileOpen)}
        title={pageTitle}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          p: { xs: 2, sm: 3 },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
