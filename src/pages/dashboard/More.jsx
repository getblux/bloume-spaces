import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, IconButton, Collapse } from '@mui/material';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom'; // Add useOutletContext
import { 
  Coin, 
  BellSimple, 
  GearSix, 
  Sun, 
  Moon,
  ChartPie,
  Calendar,
  Ticket,
  UsersThree,
  ShoppingCart,
  Image as ImageIcon
} from '@phosphor-icons/react';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useState } from 'react';

const More = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({});
  
  // Get user data from outlet context
  const { userProfile, currentUser, darkMode, toggleDarkMode } = useOutletContext();

  const isActivePath = (path) => location.pathname === path;

  const moreSections = [
    {
      title: 'Spaces',
      icon: <UsersThree size={20} />,
      items: [
        { text: 'Audience', path: '/dashboard/audience' }
      ]
    },
    {
      title: 'Shop', 
      icon: <ShoppingCart size={20} />,
      items: [
        { text: 'Orders', path: '/dashboard/orders' },
        { text: 'Buyers', path: '/dashboard/buyers' }
      ]
    },
    {
      title: 'Showcase',
      icon: <ImageIcon size={20} />,
      items: [
        { text: 'Scheduling', path: '/dashboard/scheduling' }
      ]
    },
    {
      title: 'Events',
      icon: <Calendar size={20} />,
      items: [
        { text: 'Home', path: '/dashboard/events' },
        { text: 'Tickets', path: '/dashboard/tickets' }
      ]
    },
    {
      title: 'Analytics',
      icon: <ChartPie size={20} />,
      path: '/dashboard/analytics',
      items: null
    },
    {
      title: 'Payouts', 
      icon: <Coin size={20} />,
      path: '/dashboard/payouts',
      items: null
    },
    {
      title: 'Notifications',
      icon: <BellSimple size={20} />,
      path: '/dashboard/notifications', 
      items: null
    },
    {
      title: 'Settings',
      icon: <GearSix size={20} />,
      path: '/dashboard/settings',
      items: null
    }
  ];

  const toggleSection = (title) => {
    setOpenSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <Box sx={{ p: 3, minHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        More
      </Typography>

      {/* User profile section */}
      <Box sx={{ p: 2, mb: 3, borderRadius: '8px', backgroundColor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={userProfile?.profileImage}
            alt={userProfile?.displayName}
            sx={{ 
              width: 36, 
              height: 36,
              bgcolor: userProfile?.profileImage ? 'transparent' : 'primary.main'
            }}
          >
            {userProfile?.profileImage ? null : (userProfile?.displayName?.[0] || 'U').toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {userProfile?.displayName || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {currentUser?.email || 'No email'}
            </Typography>
          </Box>
          <IconButton onClick={toggleDarkMode} size="small">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </IconButton>
        </Box>
      </Box>

      {/* More sections */}
      <List>
        {moreSections.map((section) => {
          const hasChildren = section.items && section.items.length > 0;
          const isSectionActive = hasChildren 
            ? section.items.some(item => isActivePath(item.path))
            : isActivePath(section.path);

          return (
            <Box key={section.title}>
              {/* Section Header */}
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => hasChildren ? toggleSection(section.title) : navigate(section.path)}
                  sx={{
                    borderRadius: '8px',
                    backgroundColor: isSectionActive ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: isSectionActive ? 'primary.main' : 'text.secondary'
                  }}>
                    {section.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={section.title}
                    primaryTypographyProps={{
                      fontWeight: isSectionActive ? 600 : 500,
                      fontSize: '1rem',
                    }}
                  />
                  {hasChildren && (
                    openSections[section.title] ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItemButton>
              </ListItem>

              {/* Children Items */}
              {hasChildren && (
                <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {section.items.map((item) => {
                      const isActive = isActivePath(item.path);
                      return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            onClick={() => navigate(item.path)}
                            sx={{
                              borderRadius: '8px',
                              backgroundColor: isActive ? 'action.selected' : 'transparent',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                              pl: 4,
                            }}
                          >
                            <ListItemText
                              primary={item.text}
                              primaryTypographyProps={{
                                fontWeight: isActive ? 600 : 400,
                                fontSize: '0.9rem',
                                color: 'text.secondary',
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
    </Box>
  );
};

export default More;