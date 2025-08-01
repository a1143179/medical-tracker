import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import GoogleIcon from '@mui/icons-material/Google';
import { Box, Grid, Paper, Typography, Button, useTheme, useMediaQuery, Divider, Stack, CircularProgress, Checkbox, FormControlLabel, TextField } from '@mui/material';

const GoogleLogin = () => {
  const { loginWithGoogle, loginWithInvitation } = useAuth();
  const { t } = useLanguage();
  const theme = useTheme();
  const isTestMobile = typeof window !== 'undefined' && window.Cypress && window.localStorage.getItem('forceMobile') === 'true';
  const isMobile = useMediaQuery(theme.breakpoints.down('md')) || isTestMobile;
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [invitationLoading, setInvitationLoading] = useState(false);

  const handleLogin = async (e) => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && window.Cypress && window.loginWithGoogleTest) {
        await window.loginWithGoogleTest(e, rememberMe);
      } else {
        await loginWithGoogle(e, rememberMe);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationLogin = async (e) => {
    e.preventDefault();
    if (!invitationCode.trim()) return;
    
    setInvitationLoading(true);
    try {
      await loginWithInvitation(invitationCode, rememberMe);
    } finally {
      setInvitationLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
      }}
    >
      {isMobile && loading && (
        <Box
          data-testid="login-overlay"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0,0,0,0.4)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'all', // Block all interaction
          }}
        >
          <CircularProgress color="primary" size={64} thickness={5} />
        </Box>
      )}
      <Paper
        elevation={8}
        sx={{
          maxWidth: 900,
          width: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          p: { xs: 2, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo area with transparent background */}
        <Box sx={{ width: '100%', bgcolor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', py: { xs: 2, sm: 3 }, mb: 2, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <Box sx={{ width: 198, height: 50, bgcolor: 'transparent' }}>
            <img src="/logo-blue.png" alt="Medical Tracker Logo" style={{ width: '198px', height: '50px', objectFit: 'contain' }} />
          </Box>
        </Box>
        <Divider sx={{ width: { xs: '90%', sm: '80%' }, mb: 3 }} />
        <Grid container spacing={4} sx={{ 
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 2,
          p: 2
        }}>
          <Grid item xs={12} md={6} order={isMobile ? 2 : 1} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={600} color="primary" sx={{ mb: 2, display: { xs: 'block', md: 'block' }, textAlign: 'left' }}>
              {t('whatYoullGet')}
            </Typography>
            <Stack spacing={2} sx={{ width: 'fit-content' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <GoogleIcon color="success" />
                <Typography variant="body1">{t('trackBloodSugar')}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <GoogleIcon color="success" />
                <Typography variant="body1">{t('viewTrends')}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <GoogleIcon color="success" />
                <Typography variant="body1">{t('exportData')}</Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6} order={isMobile ? 1 : 2}>
            <Typography variant="h6" fontWeight={600} color="primary" sx={{ mb: 2, display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
              {t('welcomeBack')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, display: { xs: 'block', md: 'block' } }}>
              {t('signInToAccess')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GoogleIcon />}
              onClick={handleLogin}
              className="google-signin-button"
              sx={{ 
                py: 1.5, 
                fontWeight: 600, 
                fontSize: '1rem', 
                mb: 2,
                width: { xs: '100%', md: '280px' }
              }}
              data-testid="google-signin-button"
              disabled={loading}
            >
              {t('signInWithGoogle')}
            </Button>
            
            {/* Divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: { xs: '100%', md: '280px' } }}>
              <Divider sx={{ flex: 1 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                {t('or')}
              </Typography>
              <Divider sx={{ flex: 1 }} />
            </Box>

            {/* Invitation Code Login */}
            <Box component="form" onSubmit={handleInvitationLogin} sx={{ width: { xs: '100%', md: '280px' } }}>
              <TextField
                fullWidth
                placeholder={t('invitationLoginCode')}
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                disabled={invitationLoading}
                data-testid="invitation-code-input"
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ 
                  py: 1.5, 
                  fontWeight: 600, 
                  fontSize: '1rem', 
                  mb: 2,
                  bgcolor: '#1976d2',
                  '&:hover': {
                    bgcolor: '#1565c0'
                  },
                  '&:disabled': {
                    bgcolor: '#e0e0e0'
                  }
                }}
                disabled={invitationLoading || !invitationCode.trim()}
                data-testid="invitation-login-button"
              >
                {invitationLoading ? <CircularProgress size={20} /> : t('signIn')}
              </Button>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  color="primary"
                  inputProps={{ 'data-testid': 'remember-me-checkbox' }}
                />
              }
              label={t('rememberMe')}
              sx={{ 
                mb: 1, 
                userSelect: 'none',
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': {
                  mt: 0.5
                }
              }}
            />
            {/* Make secure auth text plain */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="primary.main">
                {t('secureAuth')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ width: { xs: '90%', sm: '80%' }, mt: 4, mb: 2 }} />
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          {t('byContinuing')}{' '}
          <Box component="a" href="/terms" color="primary.main" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
            {t('termsOfService')}
          </Box>{' '}
          {t('and')}{' '}
          <Box component="a" href="/privacy" color="primary.main" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>
            {t('privacyPolicy')}
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
};

export default GoogleLogin; 