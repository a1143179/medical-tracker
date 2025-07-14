import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Chip,
  TablePagination,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Backend API URL
const API_URL = '/api/records';

function Dashboard({ mobilePage, onMobilePageChange }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [records, setRecords] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecord, setCurrentRecord] = useState({ 
    id: null, 
    measurementTime: (() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })(), 
    level: '', 
    notes: ''
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [activeTab, setActiveTab] = useState(0);
    const [message, setMessage] = useState({ text: '', severity: 'info', show: false });
  
  const showMessage = useCallback((text, severity = 'info') => {
    setMessage({ text, severity, show: true });
    // Auto-hide after 6 seconds
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 6000);
  }, []);
  
  const fetchRecords = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) {
        showMessage(t('userNotAuthenticated'), 'error');
        return;
      }
      
      const response = await fetch(`${API_URL}?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();
      setRecords(data.sort((a, b) => new Date(b.measurementTime) - new Date(a.measurementTime)));
    } catch (error) {
      showMessage(t('failedToFetchRecords'), 'error');
    }
  }, [user?.id, t, showMessage]);

  useEffect(() => {
    if (user?.id) {
      fetchRecords();
    }
  }, [user?.id, fetchRecords]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // For 'level', always store as string to preserve decimals as typed
    if (name === 'level') {
    setCurrentRecord({ ...currentRecord, [name]: value });
    } else {
      setCurrentRecord({ ...currentRecord, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = user?.id;
      if (!userId) {
        showMessage('User not authenticated', 'error');
        return;
      }

      // Client-side validation
      const level = parseFloat(currentRecord.level);
      if (isNaN(level) || level < 0.1 || level > 1000) {
        showMessage('Blood sugar level must be between 0.1 and 1000 mmol/L', 'error');
        return;
      }

      if (currentRecord.notes && currentRecord.notes.length > 1000) {
        showMessage('Notes cannot exceed 1000 characters', 'error');
        return;
      }

      if (isEditing) {
        const response = await fetch(`${API_URL}/${currentRecord.id}?userId=${encodeURIComponent(userId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...currentRecord, 
            level: level,
            measurementTime: new Date(currentRecord.measurementTime).toISOString()
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          showMessage(errorData.message || t('failedToSaveRecord'), 'error');
          return;
        }
        
        showMessage(t('recordUpdatedSuccessfully'), 'success');
      } else {
        // Convert local time to UTC before sending to backend
        const response = await fetch(`${API_URL}?userId=${encodeURIComponent(userId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...currentRecord, 
            level: level, 
            measurementTime: new Date(currentRecord.measurementTime).toISOString()
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          showMessage(errorData.message || t('failedToSaveRecord'), 'error');
          return;
        }
        
        showMessage(t('recordAddedSuccessfully'), 'success');
      }
      resetForm();
      fetchRecords();
      
      // Redirect to records tab after adding record (desktop) or dashboard (mobile)
      if (isMobile && !isEditing) {
        onMobilePageChange('dashboard');
      } else if (!isEditing) {
        setActiveTab(0); // Go to records tab
      }
    } catch (error) {
      console.error('Error submitting record:', error);
      showMessage(t('failedToSaveRecord'), 'error');
    }
  };

  const handleEdit = (record) => {
    setIsEditing(true);
    // Convert UTC time from backend to local time using standard Date methods
    // JavaScript automatically converts UTC to local time when creating Date object
    const utcDate = new Date(record.measurementTime);
    const localDateTime = formatDateTimeForInput(utcDate);
    
    setCurrentRecord({ 
      ...record, 
      measurementTime: localDateTime,
      level: record.level !== undefined && record.level !== null ? String(record.level) : ''
    });
    setOpenDialog(true);
    if (isMobile) {
      onMobilePageChange('edit');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        const userId = user?.id;
        if (!userId) {
          showMessage(t('userNotAuthenticated'), 'error');
          return;
        }
        
        await fetch(`${API_URL}/${id}?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' });
        showMessage(t('recordDeletedSuccessfully'), 'success');
        fetchRecords();
      } catch (error) {
        showMessage(t('failedToDeleteRecord'), 'error');
      }
    }
  };
  
  const resetForm = () => {
    setIsEditing(false);
    // Get current local time using standard Date methods
    const now = new Date();
    const localDateTime = formatDateTimeForInput(now);
    
    setCurrentRecord({ 
      id: null, 
      measurementTime: localDateTime, 
      level: '', 
      notes: ''
    });
    setOpenDialog(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMobilePageChange = (page) => {
    onMobilePageChange(page);
  };



  const getBloodSugarStatus = (level) => {
    if (level < 3.9) return { label: t('low'), color: 'error' };
    if (level > 10.0) return { label: t('high'), color: 'error' };
    if (level > 7.8) return { label: t('elevated'), color: 'warning' };
    return { label: t('normal'), color: 'success' };
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    
    // Format as YYYY-MM-DD HH:mm:ss in local time
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatDateTimeForInput = (dateTime) => {
    const date = new Date(dateTime);
    
    // Get local time components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getTrendIcon = (currentIndex) => {
    if (currentIndex === records.length - 1) return <RemoveIcon />;
    const current = records[currentIndex].level;
    const previous = records[currentIndex + 1].level;
    return current > previous ? <TrendingUpIcon color="error" /> : <TrendingDownIcon color="success" />;
  };

  const chartData = records.slice(0, 20).reverse().map(record => ({
    date: formatDateTime(record.measurementTime),
    level: record.level
  }));

  // Calculate 24-hour average blood sugar pattern (across all records)
  const calculate24HourData = () => {
    if (records.length === 0) return [];
    
    // Group all records by hour of day (0-23)
    const hourlyGroups = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyGroups[hour] = [];
    }
    
    // Categorize all records by hour
    records.forEach(record => {
      const recordDate = new Date(record.measurementTime);
      const hour = recordDate.getHours();
      hourlyGroups[hour].push(record.level);
    });
    
    // Calculate average for each hour
    const hourlyAverages = [];
    for (let hour = 0; hour < 24; hour++) {
      const readings = hourlyGroups[hour];
      if (readings.length > 0) {
        const average = readings.reduce((sum, level) => sum + level, 0) / readings.length;
        hourlyAverages.push({
          hour: hour,
          level: parseFloat(average.toFixed(1)),
          count: readings.length
        });
      } else {
        // No readings for this hour
        hourlyAverages.push({
          hour: hour,
          level: null,
          count: 0
        });
      }
    }
    
    // Add hour 24 (same as hour 0 for display purposes)
    hourlyAverages.push({
      hour: 24,
      level: hourlyAverages[0]?.level || null,
      count: hourlyAverages[0]?.count || 0
    });
    
    return hourlyAverages;
  };

  const chart24HourData = calculate24HourData();

  const averageLevel = records.length > 0 
    ? (records.reduce((sum, record) => sum + record.level, 0) / records.length).toFixed(1)
    : 0;

  const latestRecord = records[0];

  // Mobile Dashboard Content
  const MobileDashboard = () => (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 1 }}>
        <Card elevation={3}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('latestReading')}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {latestRecord ? `${latestRecord.level} mmol/L` : t('noData')}
            </Typography>
            {latestRecord && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {formatDateTime(latestRecord.measurementTime)}
                </Typography>
                <Chip 
                  label={getBloodSugarStatus(latestRecord.level).label}
                  color={getBloodSugarStatus(latestRecord.level).color}
                  size="medium"
                />
              </>
            )}
          </CardContent>
        </Card>
        
        <Card elevation={3}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('averageLevel')}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {averageLevel} mmol/L
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('basedOnReadings', { count: records.length })}
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={3}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('totalRecords')}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {records.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('bloodSugarMeasurements')}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  // Mobile Analytics Content
  const MobileAnalytics = () => (
    <Box sx={{ p: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2, px: 1 }}>
        {t('analytics')}
      </Typography>
      {records.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 1 }}>
          <Paper elevation={3} sx={{ p: 1.5 }}>
            <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ShowChartIcon color="primary" />
              {t('bloodSugarTrends')}
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                <YAxis domain={[0, 'dataMax + 2']} />
                <RechartsTooltip />
                <Line 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#1976d2" 
                  strokeWidth={3}
                  dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
          <Paper elevation={3} sx={{ p: 1.5 }}>
            <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <BarChartIcon color="primary" />
              {t('recentReadings')}
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
                <YAxis domain={[0, 'dataMax + 2']} />
                <RechartsTooltip />
                <Bar dataKey="level" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          <Paper elevation={3} sx={{ p: 1.5 }}>
            <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <ShowChartIcon color="primary" />
              {t('hour24Average')}
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chart24HourData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  type="number"
                  domain={[0, 24]}
                  ticks={[0, 6, 12, 18, 24]}
                  tickFormatter={(value) => `${value}:00`}
                />
                <YAxis domain={[0, 'dataMax + 2']} />
                <RechartsTooltip 
                  formatter={(value, name, props) => {
                    if (name === 'level') {
                      return [
                        value ? `${value} mmol/L` : t('noData'), 
                        t('average')
                      ];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `${label}:00`}
                />
                <Line 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#ff6b35" 
                  strokeWidth={3}
                  dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 3, px: 1 }}>
          <Typography variant="body1" color="text.secondary">
            {t('noDataForAnalytics')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('addRecordsForCharts')}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Mobile Add Record Content
  const MobileAddRecord = () => (
    <Box sx={{ p: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2, px: 1 }}>
        {t('addNewRecord')}
      </Typography>
      <Box sx={{ px: 1 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('dateTimeLabel')}
              type="datetime-local"
              name="measurementTime"
              value={currentRecord.measurementTime}
              onChange={handleInputChange}
              required
              margin="normal"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                step: 60, // 1 minute steps
                autoComplete: 'off',
                inputMode: 'numeric',
                pattern: '[0-9T:-]*',
              }}
            />
            <TextField
              fullWidth
              label={t('bloodSugarLevelLabel')}
              type="text"
              name="level"
              value={currentRecord.level === undefined || currentRecord.level === null ? '' : String(currentRecord.level)}
              onChange={handleInputChange}
              required
              margin="normal"
              helperText={t('enterBloodSugarReading')}
              inputProps={{
                inputMode: 'decimal',
                autoComplete: 'off',
                autoCorrect: 'off',
                autoCapitalize: 'off',
                spellCheck: 'false',
                pattern: '[0-9]*[.,]?[0-9]*'
              }}
            />
            <TextField
              fullWidth
              label={t('notesLabel')}
              name="notes"
              value={currentRecord.notes}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
              helperText={t('optionalNotes')}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1.5 }}>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => handleMobilePageChange('dashboard')}
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth
                data-testid="add-new-record-button"
              >
                {t('addRecordButton')}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  // Mobile Edit Record Content (reuse add form, but with different button text)
  const MobileEditRecord = () => (
    <Box sx={{ p: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2, px: 1 }}>
        {t('editRecord')}
      </Typography>
      <Box sx={{ px: 1 }}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('dateTimeLabel')}
              type="datetime-local"
              name="measurementTime"
              value={currentRecord.measurementTime}
              onChange={handleInputChange}
              required
              margin="normal"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                step: 60,
                autoComplete: 'off',
                inputMode: 'numeric',
                pattern: '[0-9T:-]*',
              }}
            />
            <TextField
              fullWidth
              label={t('bloodSugarLevelLabel')}
              type="text"
              name="level"
              value={currentRecord.level === undefined || currentRecord.level === null ? '' : String(currentRecord.level)}
              onChange={handleInputChange}
              required
              margin="normal"
              helperText={t('enterBloodSugarReading')}
              inputProps={{
                inputMode: 'decimal',
                autoComplete: 'off',
                autoCorrect: 'off',
                autoCapitalize: 'off',
                spellCheck: 'false',
                pattern: '[0-9]*[.,]?[0-9]*'
              }}
            />
            <TextField
              fullWidth
              label={t('notesLabel')}
              name="notes"
              value={currentRecord.notes}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
              helperText={t('optionalNotes')}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1.5 }}>
              <Button 
                variant="outlined" 
                fullWidth
                onClick={() => onMobilePageChange('dashboard')}
              >
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth
                data-testid="edit-record-button"
              >
                {t('saveChanges')}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Header is rendered at the top-level layout, not here. */}
      {/* Spacer for fixed header on mobile */}
      <Box sx={{ height: 64, display: { xs: 'block', md: 'none' } }} />
      
      {/* Message Display Section */}
      {message.show && (
        <Box sx={{ px: 2, py: 1 }}>
          <Alert 
            severity={message.severity}
            onClose={() => setMessage(prev => ({ ...prev, show: false }))}
            data-testid={message.severity === 'success' ? 'success-message' : 'error-message'}
          >
            {message.text}
          </Alert>
        </Box>
      )}
      
      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex',
        flexDirection: 'column'
      }}>
        {isMobile ? (
          // Mobile Layout
          <Container maxWidth="xs" sx={{ py: 0, pt: 2, flexGrow: 1, px: 0 }}>
            {mobilePage === 'dashboard' && <MobileDashboard />}
            {mobilePage === 'analytics' && <MobileAnalytics />}
            {mobilePage === 'add' && <MobileAddRecord />}
            {mobilePage === 'edit' && <MobileEditRecord />}
          </Container>
        ) : (
          // Desktop Layout
          <Container maxWidth="lg" sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', minHeight: '80vh', height: '100%' }}>
              {/* Overview Panel */}
              <Box sx={{ flex: '0 0 320px', minWidth: 280, display: 'flex', flexDirection: 'column', height: '100%', mr: 2 }}>
                <Paper elevation={3} sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                    <Card elevation={3} sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('latestReading')}
                        </Typography>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                          {latestRecord ? `${latestRecord.level} mmol/L` : t('noData')}
                        </Typography>
                        {latestRecord && (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {formatDateTime(latestRecord.measurementTime)}
                            </Typography>
                            <Chip 
                              label={getBloodSugarStatus(latestRecord.level).label}
                              color={getBloodSugarStatus(latestRecord.level).color}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </>
                        )}
                      </CardContent>
                    </Card>
                    <Card elevation={3} sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('averageLevel')}
                        </Typography>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                          {averageLevel} mmol/L
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('basedOnReadings', { count: records.length })}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card elevation={3} sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('totalRecords')}
                        </Typography>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                          {records.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('bloodSugarMeasurements')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Paper>
              </Box>
              {/* Main Panel */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Paper elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={handleTabChange} aria-label="blood sugar data tabs" size="small">
                      <Tab label={t('records')} />
                      <Tab label={t('analytics')} />
                      <Tab label={t('addRecord')} data-testid="add-new-record-tab" />
                    </Tabs>
                  </Box>
                  
                  {/* Tab Panel 0: Records */}
                  {activeTab === 0 && (
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" component="h2">
                          {t('bloodSugarRecords')}
                        </Typography>
                      </Box>
                      <TableContainer sx={{ minWidth: 800 }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: 'grey.50' }}>
                              <TableCell><strong>{t('dateTime')}</strong></TableCell>
                              <TableCell><strong>{t('bloodSugarLevel')}</strong></TableCell>
                              <TableCell><strong>{t('status')}</strong></TableCell>
                              <TableCell><strong>{t('trend')}</strong></TableCell>
                              <TableCell><strong>{t('notes')}</strong></TableCell>
                              <TableCell><strong>{t('actions')}</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody data-testid="blood-sugar-records">
                            {records
                              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                              .map((record, index) => {
                              const status = getBloodSugarStatus(record.level);
                              const actualIndex = page * rowsPerPage + index;
                              return (
                                <TableRow key={record.id} hover>
                                  <TableCell>
                                    {formatDateTime(record.measurementTime)}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {record.level}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={status.label} 
                                      color={status.color} 
                                      size="small"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {getTrendIcon(actualIndex)}
                                  </TableCell>
                                  <TableCell>
                                    {record.notes || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <Tooltip title={t('edit')}>
                                      <IconButton onClick={() => handleEdit(record)} color="primary" title="edit">
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('delete')}>
                                      <IconButton onClick={() => handleDelete(record.id)} color="error" title="delete">
                                        <DeleteIcon />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        <TablePagination
                          rowsPerPageOptions={[5, 10, 25, 50]}
                          component="div"
                          count={records.length}
                          rowsPerPage={rowsPerPage}
                          page={page}
                          onPageChange={handleChangePage}
                          onRowsPerPageChange={handleChangeRowsPerPage}
                          labelRowsPerPage={t('recordsPerPage')}
                          labelDisplayedRows={({ from, to, count }) => t('ofRecords', { from, to, count: count !== -1 ? count : `more than ${to}` })}
                        />
                      </TableContainer>
                    </Box>
                  )}

                  {/* Tab Panel 1: Analytics */}
                  {activeTab === 1 && (
                    <Box sx={{ p: 2, width: '100%' }}>
                      {records.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ShowChartIcon color="primary" />
                              {t('bloodSugarTrends')}
                            </Typography>
                            <LineChart width={800} height={300} data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis domain={[0, 'dataMax + 2']} />
                              <RechartsTooltip />
                              <Line 
                                type="monotone" 
                                dataKey="level" 
                                stroke="#1976d2" 
                                strokeWidth={3}
                                dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                              />
                            </LineChart>
                          </Paper>
                          <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BarChartIcon color="primary" />
                              {t('recentReadings')}
                            </Typography>
                            <BarChart width={800} height={300} data={chartData.slice(-10)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis domain={[0, 'dataMax + 2']} />
                              <RechartsTooltip />
                              <Bar dataKey="level" fill="#1976d2" />
                            </BarChart>
                          </Paper>
                          <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ShowChartIcon color="primary" />
                              {t('hour24Average')}
                            </Typography>
                            <LineChart width={800} height={300} data={chart24HourData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="hour" 
                                type="number"
                                domain={[0, 24]}
                                ticks={[0, 6, 12, 18, 24]}
                                tickFormatter={(value) => `${value}:00`}
                              />
                              <YAxis domain={[0, 'dataMax + 2']} />
                              <RechartsTooltip 
                                formatter={(value, name, props) => {
                                  if (name === 'level') {
                                    return [
                                      value ? `${value} mmol/L` : t('noData'), 
                                      t('average')
                                    ];
                                  }
                                  return [value, name];
                                }}
                                labelFormatter={(label) => `${label}:00`}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="level" 
                                stroke="#ff6b35" 
                                strokeWidth={3}
                                dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                                connectNulls={true}
                              />
                            </LineChart>
                          </Paper>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="body1" color="text.secondary">
                            {t('noDataForAnalytics')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t('addRecordsForCharts')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Tab Panel 2: Add Record */}
                  {activeTab === 2 && (
                    <Box sx={{ p: 2, pr: 4, pl: 4, width: '100%' }}>
                      <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                          fullWidth
                          label={t('dateTimeLabel')}
                          type="datetime-local"
                          name="measurementTime"
                          value={currentRecord.measurementTime}
                          onChange={handleInputChange}
                          required
                          margin="normal"
                          InputLabelProps={{ shrink: true }}
                          inputProps={{
                            step: 60, // 1 minute steps
                            autoComplete: 'off',
                            inputMode: 'numeric',
                            pattern: '[0-9T:-]*',
                          }}
                        />
                        <TextField
                          fullWidth
                          label={t('bloodSugarLevelLabel')}
                          type="number"
                          step="0.1"
                          name="level"
                          value={currentRecord.level === undefined || currentRecord.level === null ? '' : String(currentRecord.level)}
                          onChange={handleInputChange}
                          required
                          margin="normal"
                          helperText={t('enterBloodSugarReading')}
                          inputProps={{
                            inputMode: 'decimal',
                            autoComplete: 'off',
                            autoCorrect: 'off',
                            autoCapitalize: 'off',
                            spellCheck: 'false'
                          }}
                        />
                        <TextField
                          fullWidth
                          label={t('notesLabel')}
                          name="notes"
                          value={currentRecord.notes}
                          onChange={handleInputChange}
                          margin="normal"
                          multiline
                          rows={3}
                          helperText={t('optionalNotes')}
                        />
                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                          <Button 
                            variant="outlined" 
                            onClick={() => setActiveTab(0)}
                          >
                            {t('cancel')}
                          </Button>
                          <Button 
                            type="submit" 
                            variant="contained"
                            data-testid="add-new-record-button"
                          >
                            {t('addRecordButton')}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          </Container>
        )}
      </Box>

      {/* Add Record Dialog */}
      <Dialog open={openDialog} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditing ? t('editBloodSugarRecord') : t('addNewBloodSugarRecord')}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('dateTimeLabel')}
              type="datetime-local"
              name="measurementTime"
              value={currentRecord.measurementTime}
              onChange={handleInputChange}
              required
              margin="normal"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                step: 60, // 1 minute steps
                autoComplete: 'off',
                inputMode: 'numeric',
                pattern: '[0-9T:-]*',
              }}
            />
            <TextField
              fullWidth
              label={t('bloodSugarLevelLabel')}
              type="number"
              step="0.1"
              name="level"
              value={currentRecord.level === undefined || currentRecord.level === null ? '' : String(currentRecord.level)}
              onChange={handleInputChange}
              required
              margin="normal"
              helperText={t('enterBloodSugarReading')}
              inputProps={{
                inputMode: 'decimal',
                autoComplete: 'off',
                autoCorrect: 'off',
                autoCapitalize: 'off',
                spellCheck: 'false'
              }}
            />
            <TextField
              fullWidth
              label={t('notesLabel')}
              name="notes"
              value={currentRecord.notes}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
              helperText={t('optionalNotes')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" data-testid="add-new-record-button">
            {isEditing ? t('update') : t('addRecordButton')}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default Dashboard; 