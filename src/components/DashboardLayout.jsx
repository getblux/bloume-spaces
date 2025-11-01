import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  styled,
  Collapse,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Settings,
  Logout,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { 
  House, 
  UsersThree,
  Storefront,
  ChartPie,
  GearSix,
  Sun, 
  Moon,
  Package,
  List as ListIcon
} from '@phosphor-icons/react';
import logo from '../assets/bloume.png';

const DRAWER_WIDTH = 300;

const menuModules = [
  {
    text: 'Home',
    icon: <House size={22} weight="duotone" />,
    path: '/dashboard',
    children: null
  },
  {
    text: 'Shop',
    icon: <Storefront size={22} weight="duotone" />,
    path: '/dashboard/shop',
    children: [
      { text: 'Products', path: '/dashboard/products' },
      { text: 'Services', path: '/dashboard/services' },
      { text: 'Storefront', path: '/dashboard/storefront' },
    ]
  },
  {
    text: 'Orders',
    icon: <Package size={22} weight="duotone" />,
    path: '/dashboard/orders',
    children: null
  },
  {
    text: 'Customers',
    icon: <UsersThree size={22} weight="duotone" />,
    path: '/dashboard/customers',
    children: null
  },
  {
    text: 'Analytics',
    icon: <ChartPie size={22} weight="duotone" />,
    path: '/dashboard/analytics',
    children: null
  },
  {
    text: 'Settings',
    icon: <GearSix size={22} weight="duotone" />,
    path: '/dashboard/settings',
    children: null
  }
];

const MainContentContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  height: '100vh',
  backgroundColor: theme.palette.background.level1,
  overflow: 'hidden',
  [theme.breakpoints.up('lg')]: {
    width: `calc(100% - ${DRAWER_WIDTH}px)`,
    marginLeft: DRAWER_WIDTH,
  },
}));

const ContentCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: '12px',
  margin: theme.spacing(2),
  height: 'calc(100vh - 40px)',
  border: `1px solid rgba(0, 0, 0, 0.07)`,
  overflow: 'hidden',
  display: 'flex',
  maxWidth: '100%',
  boxShadow: '0 1px 1px rgba(0,0,0,0.07)',
  flexDirection: 'column',
  [theme.breakpoints.down('lg')]: {
    borderRadius: 0,
    margin: 0,
    height: '100%',
    border: 'none',
  },
}));

const ScrollableContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(5),
  maxWidth: '1440px',
  margin: '0 auto',
  width: '100%',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
  },
  '&::-webkit-scrollbar': {
    display: 'none',
  },
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: DRAWER_WIDTH,
    backgroundColor: 'transparent',
    borderRight: 'none',
    boxShadow: 'none',
  },
}));


const DashboardLayout = ({ darkMode, toggleDarkMode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path) => {
    if (path) {
      navigate(path);
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleModuleToggle = (moduleName) => {
    setOpenModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const isActivePath = (path) => location.pathname === path;
  const isChildActive = (children) => {
    if (!children) return false;
    return children.some(child => isActivePath(child.path));
  };

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: theme.palette.background.level1,
    }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'left', justifyContent: 'left' }}>
        <Box
          component="img"
          src={logo}
          alt="Bloume Spaces"
          sx={{
            height: 42,
            width: 'auto',
            maxWidth: '180px',
            objectFit: 'contain',
          }}
        />
      </Box>

      <List sx={{ flex: 1, p: 2, backgroundColor: 'transparent' }}>
        {menuModules.map((item) => {
          const isActive = isActivePath(item.path);
          const hasChildren = item.children && item.children.length > 0;
          const isParentActive = hasChildren ? isChildActive(item.children) : isActive;

          return (
            <Box key={item.text}>
              <ListItem disablePadding sx={{ mb: 0.5, backgroundColor: 'transparent' }}>
                <ListItemButton
                  onClick={() => hasChildren ? handleModuleToggle(item.text) : handleMenuClick(item.path)}
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: isParentActive ? theme.palette.background.paper : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: isParentActive ? 'primary.main' : 'text.secondary'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isParentActive ? 600 : 500,
                    }}
                  />
                  {hasChildren && (
                    openModules[item.text] ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItemButton>
              </ListItem>

              {hasChildren && (
                <Collapse in={openModules[item.text]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => {
                      const isChildActive = isActivePath(child.path);
                      return (
                        <ListItem key={child.text} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            onClick={() => handleMenuClick(child.path)}
                            sx={{
                              borderRadius: '8px',
                              backgroundColor: isChildActive ? 'action.selected' : 'transparent',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                              pl: 4,
                            }}
                          >
                            <ListItemText
                              primary={child.text}
                              primaryTypographyProps={{
                                fontWeight: isChildActive ? 600 : 400,
                                fontSize: '0.9rem',
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={userProfile?.profileImage}
            alt={userProfile?.displayName}
            onClick={handleProfileMenuOpen}
            sx={{ width: 36, height: 36, cursor: 'pointer' }}
          >
            {(userProfile?.displayName?.[0] || 'U').toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {userProfile?.displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentUser?.email}
            </Typography>
          </Box>
          <IconButton onClick={toggleDarkMode} size="small">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
   {isMobile && (
  <>
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: '0px 0px',
        display: 'flex',
        alignItems: 'center',
        minHeight: '44px',
      }}
    >
      <IconButton
        onClick={handleDrawerToggle}
        sx={{ mr: 2, color: theme.palette.text.primary }}
      >
        <ListIcon size={24} />
      </IconButton>
      <Box sx={{ flexGrow: 1 }} />
      <IconButton 
        onClick={toggleDarkMode} 
        sx={{ color: theme.palette.text.primary }}
      >
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </IconButton>
    </Box>
  </>
)}
     <StyledDrawer
  variant="temporary"
  open={mobileOpen}
  onClose={handleDrawerToggle}
  ModalProps={{ keepMounted: true }}
  sx={{ display: { xs: 'block', lg: 'none' } }}
>
  {drawer}
</StyledDrawer>

<StyledDrawer
  variant="permanent"
  sx={{ display: { xs: 'none', lg: 'block' } }}
  open
>
  {drawer}
</StyledDrawer>

      <MainContentContainer>
       
        <ContentCard>
          <ScrollableContent>
            <Outlet context={{ userProfile, currentUser, darkMode, toggleDarkMode }} />
          </ScrollableContent>
        </ContentCard>
      </MainContentContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={() => { navigate('/dashboard/settings'); handleProfileMenuClose(); }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DashboardLayout;