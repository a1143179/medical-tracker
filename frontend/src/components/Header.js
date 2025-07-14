import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  FormControl,
  Select,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { Logout, Language, Menu as MenuIcon, Dashboard, Person } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Header = ({ onMobileNavigate }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    setMobileMenuOpen(false);
    logout();
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLanguageChange = async (event) => {
    const newLanguage = event.target.value;
    try {
      await setLanguage(newLanguage);
    } catch (error) {
      setSnackbar({ open: true, message: t('failedToSaveLanguage'), severity: 'error' });
    }
  };

  return (
    <>
      <AppBar
        position="static"
        color="primary"
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: { xs: 'fixed', md: 'static' },
          boxShadow: '0 4px 16px 0 rgba(0,0,0,0.5)'
        }}
      >
        <Toolbar>
            {/* Hamburger Menu - Only visible on mobile */}
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuToggle}
              sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Page Title - Hidden on mobile */}
            
            
            {/* Language Selector and Profile Icon Container */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
              {/* Language Selector */}
              <FormControl size="small" sx={{ mr: 1, minWidth: { xs: 80, md: 120 } }}>
                <Select
                  data-testid="language-selector"
                  value={language}
                  onChange={handleLanguageChange}
                  startAdornment={<Language sx={{ mr: { xs: 0.5, md: 1 }, color: 'white', fontSize: { xs: '1.2rem', md: '1.5rem' } }} />}
                  sx={{ 
                    color: 'white',
                    '& .MuiSelect-icon': { color: 'white' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                    '& .MuiSelect-select': { py: 0.5, fontSize: { xs: '0.875rem', md: '1rem' } }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: { mt: 1 }
                    }
                  }}
                >
                  <MenuItem value="en">{t('english')}</MenuItem>
                  <MenuItem value="zh">{t('chinese')}</MenuItem>
                </Select>
              </FormControl>
              

              
              {/* Welcome Message - Only visible on desktop */}
              {user && (
                <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', md: 'block' } }}>
                  {t('welcome')} {user.name}
                </Typography>
              )}
              
              {/* Profile Icon - Always visible when logged in */}
              {user && (
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                  data-testid="profile-menu"
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: 'primary.dark',
                      fontSize: '0.875rem'
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </AppBar>
        
        {/* Spacer for fixed header on mobile */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, height: 64 }} />

        {/* Mobile Drawer Menu */}
        <Drawer
          anchor="left"
          open={mobileMenuOpen}
          onClose={handleMobileMenuToggle}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              pt: 8, // Add top padding to account for fixed header
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
              {t('appTitle')}
            </Typography>
            {user && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    mr: 2,
                    bgcolor: 'primary.dark',
                    fontSize: '1rem'
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
          <Divider />
          <List>
            <ListItem onClick={() => { if (typeof onMobileNavigate === 'function') onMobileNavigate('add'); handleMobileMenuToggle(); }} data-testid="add-record-menu-item">
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText primary={t('addNewRecord')} />
            </ListItem>
            <ListItem onClick={() => { if (typeof onMobileNavigate === 'function') onMobileNavigate('dashboard'); handleMobileMenuToggle(); }}>
              <ListItemIcon>
                <Dashboard />
              </ListItemIcon>
              <ListItemText primary={t('dashboard')} />
            </ListItem>
            <ListItem onClick={() => { if (typeof onMobileNavigate === 'function') onMobileNavigate('analytics'); handleMobileMenuToggle(); }}>
              <ListItemIcon>
                <Dashboard />
              </ListItemIcon>
              <ListItemText primary={t('analytics')} />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary={t('logout')} />
            </ListItem>
          </List>
        </Drawer>
        
        {/* Profile Menu - Shared between desktop and mobile */}
        {user && (
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    mr: 1,
                    bgcolor: 'primary.dark',
                    fontSize: '0.75rem'
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>


            <MenuItem onClick={handleLogout} data-testid="logout-button">
              <Logout sx={{ mr: 1 }} />
              {t('logout')}
            </MenuItem>
          </Menu>
        )}

        {/* Snackbar for language save notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            data-testid={snackbar.severity === 'success' ? 'success-message' : 'error-message'}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
    </>
  );
};

export default Header; 