import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import GoogleLogin from './components/GoogleLogin';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Wrapper component that provides language context with auth access
const AppWithProviders = ({ children }) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LanguageProvider>
  );
};

// Main App Layout with Header
const AppLayout = () => {
  const { user } = useAuth();
  const [mobilePage, setMobilePage] = useState('dashboard'); // 'dashboard', 'analytics', 'add'

  const handleMobileNavigate = (page) => {
    setMobilePage(page);
  };

  return (
    <>
      <Header onMobileNavigate={handleMobileNavigate} />
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <GoogleLogin />
            </PublicRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard mobilePage={mobilePage} onMobilePageChange={handleMobileNavigate} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/terms"
          element={<TermsPage />}
        />
        <Route 
          path="/privacy"
          element={<PrivacyPage />}
        />
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="*" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component - redirects authenticated users to dashboard
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>{t('loading')}</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppWithProviders>
        <Router>
          <AppLayout />
        </Router>
      </AppWithProviders>
    </ThemeProvider>
  );
}

export default App;