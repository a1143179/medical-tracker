import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
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
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import SaveToDesktopPopup from './SaveToDesktopPopup';

// Backend API URL
const API_URL = '/api/records';

function Dashboard({ mobilePage, onMobilePageChange }) {
  const { user, updatePreferredValueType } = useAuth();
  const { t, language } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [records, setRecords] = useState([]);
  const [valueTypes, setValueTypes] = useState([]);
  const [selectedValueType, setSelectedValueType] = useState(''); // Initialize as empty string
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
    value: '', 
    value2: '', // Second value for blood pressure
    notes: '',
    valueTypeId: ''
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [activeTab, setActiveTab] = useState(0);
  const [message, setMessage] = useState({ text: '', severity: 'info', show: false });
  
  // Function to get localized value type name
  const getLocalizedValueTypeName = useCallback((valueType) => {
    if (!valueType) return '';
    return language === 'zh' ? valueType.nameZh : valueType.name;
  }, [language]);
  
  // Memoize selected value type to prevent unnecessary re-renders
  const selectedValueTypeData = useMemo(() => {
    return valueTypes.find(vt => vt.id === selectedValueType);
  }, [valueTypes, selectedValueType]);
  
  // Function to get selected value type
  const getSelectedValueType = useCallback(() => {
    return selectedValueTypeData;
  }, [selectedValueTypeData]);

  // Function to handle value type change
  const handleValueTypeChange = useCallback(async (newValueType) => {
    setSelectedValueType(newValueType);
    
    // Save to database if user is authenticated
    if (user?.id) {
      await updatePreferredValueType(newValueType);
    }
  }, [user?.id, updatePreferredValueType]);
  
  // Function to check if current value type requires two values
  const requiresTwoValues = useCallback(() => {
    return selectedValueTypeData?.requiresTwoValues || false;
  }, [selectedValueTypeData]);
  
  // Memoize filtered records to prevent unnecessary re-renders
  const filteredRecords = useMemo(() => {
    return records
      .filter(record => record.valueTypeId === selectedValueType)
      .sort((a, b) => new Date(b.measurementTime) - new Date(a.measurementTime));
  }, [records, selectedValueType]);
  

  
  // Memoize average value calculation
  const averageValue = useMemo(() => {
    return filteredRecords.length > 0 
      ? (filteredRecords.reduce((sum, record) => sum + record.value, 0) / filteredRecords.length).toFixed(1)
      : 0;
  }, [filteredRecords]);

  // Memoize average value2 calculation for blood pressure
  const averageValue2 = useMemo(() => {
    if (!requiresTwoValues()) return null;
    const recordsWithValue2 = filteredRecords.filter(record => record.value2 !== null && record.value2 !== undefined);
    return recordsWithValue2.length > 0 
      ? (recordsWithValue2.reduce((sum, record) => sum + record.value2, 0) / recordsWithValue2.length).toFixed(1)
      : null;
  }, [filteredRecords, requiresTwoValues]);

  // Memoize highest reading
  const highestRecord = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    return filteredRecords.reduce((max, record) => 
      record.value > max.value ? record : max
    );
  }, [filteredRecords]);

  // Memoize lowest reading
  const lowestRecord = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    return filteredRecords.reduce((min, record) => 
      record.value < min.value ? record : min
    );
  }, [filteredRecords]);
  
  // Memoize latest record
  const latestRecord = useMemo(() => {
    return filteredRecords[0];
  }, [filteredRecords]);
  
  // Function to get status based on value type and value
  const getValueStatus = useCallback((value) => {
    const valueType = getSelectedValueType();
    if (!valueType) return { label: t('normal'), color: 'success' };
    
    // Different status logic for different value types
    switch (valueType.id) {
      case 1: // Blood Sugar
        if (value < 3.9) return { label: t('low'), color: 'error' };
        if (value > 10.0) return { label: t('high'), color: 'error' };
        if (value > 7.8) return { label: t('elevated'), color: 'warning' };
        return { label: t('normal'), color: 'success' };
      case 2: // Blood Pressure (systolic)
        if (value < 90) return { label: t('low'), color: 'error' };
        if (value > 140) return { label: t('high'), color: 'error' };
        if (value > 120) return { label: t('elevated'), color: 'warning' };
        return { label: t('normal'), color: 'success' };
      case 3: // Body Fat %
        if (value < 10) return { label: t('low'), color: 'error' };
        if (value > 30) return { label: t('high'), color: 'error' };
        if (value > 25) return { label: t('elevated'), color: 'warning' };
        return { label: t('normal'), color: 'success' };
      case 4: // Weight
        // For weight, we'll use a simple range based on typical adult weights
        if (value < 40) return { label: t('low'), color: 'error' };
        if (value > 120) return { label: t('high'), color: 'error' };
        return { label: t('normal'), color: 'success' };
      default:
        return { label: t('normal'), color: 'success' };
    }
  }, [getSelectedValueType, t]);
  
  // Memoize average status
  const averageStatus = useMemo(() => {
    return getValueStatus(Number(averageValue));
  }, [averageValue, getValueStatus]);
  
  const showMessage = useCallback((text, severity = 'info') => {
    setMessage({ text, severity, show: true });
    // Auto-hide after 6 seconds
    setTimeout(() => setMessage(prev => ({ ...prev, show: false })), 6000);
  }, []);
  
  const fetchValueTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/valuetypes', {
        credentials: 'include'
      });
      const data = await response.json();
      setValueTypes(data);
    } catch (error) {
      console.error('Failed to fetch value types:', error);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) {
        showMessage(t('userNotAuthenticated'), 'error');
        return;
      }
      
      const response = await fetch(`${API_URL}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setRecords(data.sort((a, b) => new Date(b.measurementTime) - new Date(a.measurementTime)));
    } catch (error) {
      showMessage(t('failedToFetchRecords'), 'error');
    }
  }, [user?.id, t, showMessage]);

  useEffect(() => {
    fetchValueTypes();
  }, [fetchValueTypes]);

  useEffect(() => {
    if (user?.id) {
      fetchRecords();
    }
  }, [user?.id, fetchRecords]);

  // Set default value type when valueTypes are loaded
  useEffect(() => {
    if (valueTypes.length > 0 && !selectedValueType) {
      const defaultType = user?.preferredValueTypeId || valueTypes[0]?.id;
      if (defaultType) {
        setSelectedValueType(defaultType);
      }
    }
  }, [valueTypes, selectedValueType, user?.preferredValueTypeId]);

  // Sync selected value type with user's preferred type when user changes
  useEffect(() => {
    if (user?.preferredValueTypeId && user.preferredValueTypeId !== selectedValueType && valueTypes.length > 0) {
      setSelectedValueType(user.preferredValueTypeId);
    }
  }, [user?.preferredValueTypeId, selectedValueType, valueTypes.length]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    // Always store as string to preserve decimals as typed and prevent focus loss
    setCurrentRecord(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userId = user?.id;
      if (!userId) {
        showMessage('User not authenticated', 'error');
        return;
      }

      // Client-side validation
      const value = parseFloat(currentRecord.value);
      if (isNaN(value) || value < 0.1 || value > 1000) {
        showMessage('Blood sugar value must be between 0.1 and 1000 mmol/L', 'error');
        return;
      }

      // Validate second value if required
      let value2 = null;
      if (requiresTwoValues() && currentRecord.value2) {
        value2 = parseFloat(currentRecord.value2);
        if (isNaN(value2) || value2 < 0.1 || value2 > 1000) {
          showMessage('Second value must be between 0.1 and 1000', 'error');
          return;
        }
      }

      if (currentRecord.notes && currentRecord.notes.length > 1000) {
        showMessage('Notes cannot exceed 1000 characters', 'error');
        return;
      }

      if (isEditing) {
        const response = await fetch(`${API_URL}/${currentRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            ...currentRecord, 
            value: value,
            value2: value2,
            valueTypeId: selectedValueType, // Use current selected value type
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
        const response = await fetch(`${API_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            ...currentRecord, 
            value: value,
            value2: value2,
            valueTypeId: selectedValueType, // Use current selected value type
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
      value: record.value !== undefined && record.value !== null ? String(record.value) : '',
      value2: record.value2 !== undefined && record.value2 !== null ? String(record.value2) : ''
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
        
        await fetch(`${API_URL}/${id}`, { 
          method: 'DELETE',
          credentials: 'include'
        });
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
      value: '', 
      value2: '', // Reset second value
      notes: '',
      valueTypeId: selectedValueType // Use current selected value type
    });
    setOpenDialog(false);
  };

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleMobilePageChange = useCallback((page) => {
    onMobilePageChange(page);
  }, [onMobilePageChange]);



  // Keep the old function for backward compatibility, but use the new one
  const getBloodSugarStatus = (value) => {
    return getValueStatus(value);
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
    const current = records[currentIndex].value;
    const previous = records[currentIndex + 1].value;
    return current > previous ? <TrendingUpIcon color="error" /> : <TrendingDownIcon color="success" />;
  };

  // 1. Sort chartData from oldest to newest for X axis
  const sortedRecords = [...filteredRecords].sort((a, b) => new Date(a.measurementTime) - new Date(b.measurementTime));
  const chartData = sortedRecords.map(record => ({
    date: formatDateTime(record.measurementTime),
    value: record.value,
    value2: record.value2
  }));

  // Calculate 24-hour average pattern (across filtered records)
  const calculate24HourData = () => {
    if (filteredRecords.length === 0) return [];
    
    // Group all records by hour of day (0-23)
    const hourlyGroups = {};
    const hourlyGroups2 = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyGroups[hour] = [];
      hourlyGroups2[hour] = [];
    }
    
    // Categorize all records by hour
    filteredRecords.forEach(record => {
      const recordDate = new Date(record.measurementTime);
      const hour = recordDate.getHours();
      hourlyGroups[hour].push(record.value);
      if (record.value2 !== null && record.value2 !== undefined) {
        hourlyGroups2[hour].push(record.value2);
      }
    });
    
    // Calculate average for each hour
    const hourlyAverages = [];
    for (let hour = 0; hour < 24; hour++) {
      const readings = hourlyGroups[hour];
      const readings2 = hourlyGroups2[hour];
      if (readings.length > 0) {
        const average = readings.reduce((sum, value) => sum + value, 0) / readings.length;
        const average2 = readings2.length > 0 
          ? readings2.reduce((sum, value) => sum + value, 0) / readings2.length 
          : null;
        hourlyAverages.push({
          hour: hour,
          value: parseFloat(average.toFixed(1)),
          value2: average2 ? parseFloat(average2.toFixed(1)) : null,
          count: readings.length
        });
      } else {
        // No readings for this hour
        hourlyAverages.push({
          hour: hour,
          value: null,
          value2: null,
          count: 0
        });
      }
    }
    
    // Add hour 24 (same as hour 0 for display purposes)
    hourlyAverages.push({
      hour: 24,
      value: hourlyAverages[0]?.value || null,
      value2: hourlyAverages[0]?.value2 || null,
      count: hourlyAverages[0]?.count || 0
    });
    
    return hourlyAverages;
  };

  const chart24HourData = calculate24HourData();

  // Mobile Dashboard Content
  const MobileDashboard = () => (
    <Box sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, px: 1 }}>
        {/* Medical Value Type Selector */}
        <Card elevation={3}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('medicalValueTypeLabel')}
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                data-testid="value-type-dropdown"
                value={selectedValueType}
                onChange={(e) => handleValueTypeChange(e.target.value)}
                displayEmpty
                sx={{ mt: 1 }}
                inputProps={{ 'data-testid': 'value-type-native-input' }}
                MenuProps={{
                  PaperProps: {
                    sx: { 
                      maxHeight: 200
                    }
                  },
                  anchorOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  disableScrollLock: true,
                  keepMounted: false,
                  getContentAnchorEl: null
                }}
              >
                {valueTypes.map((valueType) => (
                  <MenuItem 
                    key={valueType.id} 
                    value={valueType.id}
                    data-testid={`value-type-option-${valueType.id}`}
                  >
                    {getLocalizedValueTypeName(valueType)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
        
        <Card elevation={3}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('latestReading')}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {latestRecord ? (
                requiresTwoValues() && latestRecord.value2 ? (
                  `${latestRecord.value}/${latestRecord.value2} ${getSelectedValueType()?.unit || 'mmHg'}`
                ) : (
                  `${latestRecord.value} ${getSelectedValueType()?.unit || 'mmol/L'}`
                )
              ) : t('noData')}
            </Typography>
            {latestRecord && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {formatDateTime(latestRecord.measurementTime)}
                </Typography>
                <Chip 
                  label={getBloodSugarStatus(latestRecord.value).label}
                  color={getBloodSugarStatus(latestRecord.value).color}
                  size="medium"
                />
              </>
            )}
          </CardContent>
        </Card>
        
        <Card elevation={3}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('highestReading')}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {highestRecord ? (
                requiresTwoValues() && highestRecord.value2 ? (
                  `${highestRecord.value}/${highestRecord.value2} ${getSelectedValueType()?.unit || 'mmHg'}`
                ) : (
                  `${highestRecord.value} ${getSelectedValueType()?.unit || 'mmol/L'}`
                )
              ) : t('noData')}
            </Typography>
            {highestRecord && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {formatDateTime(highestRecord.measurementTime)}
                </Typography>
                <Chip 
                  label={getBloodSugarStatus(highestRecord.value).label}
                  color={getBloodSugarStatus(highestRecord.value).color}
                  size="medium"
                />
              </>
            )}
          </CardContent>
        </Card>
        
        <Card elevation={3}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('lowestReading')}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
              {lowestRecord ? (
                requiresTwoValues() && lowestRecord.value2 ? (
                  `${lowestRecord.value}/${lowestRecord.value2} ${getSelectedValueType()?.unit || 'mmHg'}`
                ) : (
                  `${lowestRecord.value} ${getSelectedValueType()?.unit || 'mmol/L'}`
                )
              ) : t('noData')}
            </Typography>
            {lowestRecord && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {formatDateTime(lowestRecord.measurementTime)}
                </Typography>
                <Chip 
                  label={getBloodSugarStatus(lowestRecord.value).label}
                  color={getBloodSugarStatus(lowestRecord.value).color}
                  size="medium"
                />
              </>
            )}
          </CardContent>
        </Card>
        
        <Card elevation={3}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {/* 2. Change label to Average Value */}
              {t('averageValue')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {requiresTwoValues() ? (
                  `${averageValue}/${averageValue2 || 'N/A'} ${getSelectedValueType()?.unit || 'mmHg'}`
                ) : (
                  `${averageValue} ${getSelectedValueType()?.unit || 'mmol/L'}`
                )}
              </Typography>
            </Box>
            {/* Move High/Low label below mmol/L */}
            <Box sx={{ mt: 1 }}>
              <Chip label={averageStatus.label} color={averageStatus.color} size="small" />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t('basedOnReadings', { count: filteredRecords.length })}
            </Typography>
          </CardContent>
        </Card>
        
        <Card elevation={3}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('totalRecords')}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {filteredRecords.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getLocalizedValueTypeName(getSelectedValueType()) || t('bloodSugarMeasurements')}
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
      {filteredRecords.length > 0 ? (
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
                <RechartsTooltip 
                  formatter={(value, name, props) => {
                    if (name === 'value') {
                      return [
                        value ? `${value} ${getSelectedValueType()?.unit || 'mmol/L'}` : t('noData'), 
                        requiresTwoValues() ? t('systolicPressure') : t('average')
                      ];
                    }
                    if (name === 'value2') {
                      return [
                        value ? `${value} ${getSelectedValueType()?.unit2 || 'mmHg'}` : t('noData'), 
                        t('diastolicPressure')
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1976d2" 
                  strokeWidth={3}
                  dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                  name={requiresTwoValues() ? t('systolicPressure') : t('average')}
                />
                {requiresTwoValues() && (
                  <Line 
                    type="monotone" 
                    dataKey="value2" 
                    stroke="#ff6b35" 
                    strokeWidth={3}
                    dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                    name={t('diastolicPressure')}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Paper>
          {/* Removed the second chart (BarChart for recent readings) */}
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
                    if (name === 'value') {
                      return [
                        value ? `${value} ${getSelectedValueType()?.unit || 'mmol/L'}` : t('noData'), 
                        requiresTwoValues() ? t('systolicPressure') : t('average')
                      ];
                    }
                    if (name === 'value2') {
                      return [
                        value ? `${value} ${getSelectedValueType()?.unit2 || 'mmHg'}` : t('noData'), 
                        t('diastolicPressure')
                      ];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `${label}:00`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ff6b35" 
                  strokeWidth={3}
                  dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                  connectNulls={true}
                  name={requiresTwoValues() ? t('systolicPressure') : t('average')}
                />
                {requiresTwoValues() && (
                  <Line 
                    type="monotone" 
                    dataKey="value2" 
                    stroke="#1976d2" 
                    strokeWidth={3}
                    dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                    connectNulls={true}
                    name={t('diastolicPressure')}
                  />
                )}
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
  const MobileAddRecord = memo(() => {
    // Memoize the label to prevent unnecessary re-renders
    const medicalRecordLabel = useMemo(() => t('medicalRecordLabel'), []);
    // Use useRef to maintain focus and prevent unnecessary re-renders
    const valueInputRef = useRef(null);
    const value2InputRef = useRef(null);
    
    // Always provide a string value for the input to prevent focus loss
    const valueValue = currentRecord.value ?? '';
    const value2Value = currentRecord.value2 ?? '';
    
    // Custom onChange handler to maintain focus
    const handleValueChange = useCallback((e) => {
      const { name, value } = e.target;
      setCurrentRecord(prev => ({ ...prev, [name]: value }));
    }, []);
    
    return (
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
                onChange={handleValueChange}
                required
                margin="normal"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step: 60, // 1 minute steps
                  autoComplete: 'off',
                  inputMode: 'numeric',
                }}
              />
              <TextField
                fullWidth
                label={requiresTwoValues() ? t('systolicPressure') : medicalRecordLabel}
                type="text"
                name="value"
                value={valueValue}
                onChange={handleValueChange}
                required
                margin="normal"
                inputRef={valueInputRef}
                inputProps={{
                  inputMode: 'decimal',
                  autoComplete: 'off',
                  autoCorrect: 'off',
                  autoCapitalize: 'off',
                  spellCheck: 'false',
                }}
              />
              {requiresTwoValues() && (
                <TextField
                  fullWidth
                  label={t('diastolicPressure')}
                  type="text"
                  name="value2"
                  value={value2Value}
                  onChange={handleValueChange}
                  required
                  margin="normal"
                  inputRef={value2InputRef}
                  inputProps={{
                    inputMode: 'decimal',
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    autoCapitalize: 'off',
                    spellCheck: 'false',
                  }}
                />
              )}
              <TextField
                fullWidth
                label={t('notesLabel')}
                name="notes"
                value={currentRecord.notes}
                onChange={handleValueChange}
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
  });
  // eslint-disable-next-line react/display-name
  
  // Mobile Edit Record Content (reuse add form, but with different button text)
  const MobileEditRecord = memo(() => {
    // Use useRef to maintain focus and prevent unnecessary re-renders
    const valueInputRef = useRef(null);
    const value2InputRef = useRef(null);
    
    // Always provide a string value for the input to prevent focus loss
    const valueValue = currentRecord.value ?? '';
    const value2Value = currentRecord.value2 ?? '';
    
    // Custom onChange handler to maintain focus
    const handleValueChange = useCallback((e) => {
      const { name, value } = e.target;
      setCurrentRecord(prev => ({ ...prev, [name]: value }));
    }, []);
    
    return (
      <Box sx={{ p: 0 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 2, px: 1 }}>
          {t('editRecord')}
        </Typography>
        <Box sx={{ px: 1 }}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="mobile-edit-value-type-label">{t('medicalValueTypeLabel')}</InputLabel>
                <Select
                  data-testid="value-type-dropdown"
                  labelId="mobile-edit-value-type-label"
                  value={currentRecord.valueTypeId}
                  label={t('medicalValueTypeLabel')}
                  name="valueTypeId"
                  onChange={handleValueChange}
                  inputProps={{ 'data-testid': 'value-type-native-input' }}
                  MenuProps={{
                    PaperProps: {
                      sx: { 
                        maxHeight: 200
                      }
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    disableScrollLock: true,
                    keepMounted: false,
                    getContentAnchorEl: null
                  }}
                >
                  {valueTypes.map((valueType) => (
                    <MenuItem key={valueType.id} value={valueType.id} data-testid={`value-type-option-${valueType.id}`}>
                      {getLocalizedValueTypeName(valueType)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label={t('dateTimeLabel')}
                type="datetime-local"
                name="measurementTime"
                value={currentRecord.measurementTime}
                onChange={handleValueChange}
                required
                margin="normal"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  step: 60,
                  autoComplete: 'off',
                  inputMode: 'numeric',
                }}
              />
              <TextField
                fullWidth
                label={requiresTwoValues() ? t('systolicPressure') : t('medicalRecordLabel')}
                type="text"
                name="value"
                value={valueValue}
                onChange={handleValueChange}
                required
                margin="normal"
                inputRef={valueInputRef}
                inputProps={{
                  inputMode: 'decimal',
                  autoComplete: 'off',
                  autoCorrect: 'off',
                  autoCapitalize: 'off',
                  spellCheck: 'false',
                }}
              />
              {requiresTwoValues() && (
                <TextField
                  fullWidth
                  label={t('diastolicPressure')}
                  type="text"
                  name="value2"
                  value={value2Value}
                  onChange={handleValueChange}
                  required
                  margin="normal"
                  inputRef={value2InputRef}
                  inputProps={{
                    inputMode: 'decimal',
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    autoCapitalize: 'off',
                    spellCheck: 'false',
                  }}
                />
              )}
              <TextField
                fullWidth
                label={t('notesLabel')}
                name="notes"
                value={currentRecord.notes}
                onChange={handleValueChange}
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
  });

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
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <SaveToDesktopPopup />
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
            <Box sx={{ display: 'flex', minHeight: '80vh', height: '100%', position: 'relative' }}>
              {/* Overview Panel */}
              <Box sx={{ flex: '0 0 320px', minWidth: 280, display: 'flex', flexDirection: 'column', height: '100%', mr: 2, position: 'relative' }}>
                <Paper elevation={3} sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                    {/* Medical Value Type Selector */}
                    <Card elevation={3} sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('medicalValueTypeLabel')}
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            data-testid="value-type-dropdown"
                            value={selectedValueType}
                            onChange={(e) => handleValueTypeChange(e.target.value)}
                            displayEmpty
                            sx={{ mt: 1 }}
                            MenuProps={{
                              PaperProps: {
                                sx: { 
                                  maxHeight: 200
                                }
                              },
                              anchorOrigin: {
                                vertical: 'bottom',
                                horizontal: 'left',
                              },
                              transformOrigin: {
                                vertical: 'top',
                                horizontal: 'left',
                              },
                              disableScrollLock: true,
                              keepMounted: false,
                              getContentAnchorEl: null
                            }}
                          >
                            {valueTypes.map((valueType) => (
                              <MenuItem 
                                key={valueType.id} 
                                value={valueType.id}
                                data-testid={`value-type-option-${valueType.id}`}
                              >
                                {getLocalizedValueTypeName(valueType)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </CardContent>
                    </Card>
                    
                    <Card elevation={3} sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('latestReading')}
                        </Typography>
                                    <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                          {latestRecord ? (
                            requiresTwoValues() && latestRecord.value2 ? (
                              `${latestRecord.value}/${latestRecord.value2} ${getSelectedValueType()?.unit || 'mmol/L'}`
                            ) : (
                              `${latestRecord.value} ${getSelectedValueType()?.unit || 'mmol/L'}`
                            )
                          ) : t('noData')}
                        </Typography>
                        {latestRecord && (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {formatDateTime(latestRecord.measurementTime)}
                            </Typography>
                            <Chip 
                              label={getBloodSugarStatus(latestRecord.value).label}
                              color={getBloodSugarStatus(latestRecord.value).color}
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
                          {t('highestReading')}
                        </Typography>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                          {highestRecord ? (
                            requiresTwoValues() && highestRecord.value2 ? (
                              `${highestRecord.value}/${highestRecord.value2} ${getSelectedValueType()?.unit || 'mmHg'}`
                            ) : (
                              `${highestRecord.value} ${getSelectedValueType()?.unit || 'mmol/L'}`
                            )
                          ) : t('noData')}
                        </Typography>
                        {highestRecord && (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {formatDateTime(highestRecord.measurementTime)}
                            </Typography>
                            <Chip 
                              label={getBloodSugarStatus(highestRecord.value).label}
                              color={getBloodSugarStatus(highestRecord.value).color}
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
                          {t('lowestReading')}
                        </Typography>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                          {lowestRecord ? (
                            requiresTwoValues() && lowestRecord.value2 ? (
                              `${lowestRecord.value}/${lowestRecord.value2} ${getSelectedValueType()?.unit || 'mmHg'}`
                            ) : (
                              `${lowestRecord.value} ${getSelectedValueType()?.unit || 'mmol/L'}`
                            )
                          ) : t('noData')}
                        </Typography>
                        {lowestRecord && (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {formatDateTime(lowestRecord.measurementTime)}
                            </Typography>
                            <Chip 
                              label={getBloodSugarStatus(lowestRecord.value).label}
                              color={getBloodSugarStatus(lowestRecord.value).color}
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
                          {/* 2. Change label to Average Value */}
                          {t('averageValue')}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                            {requiresTwoValues() ? (
                              // For blood pressure, show both systolic and diastolic averages
                              `${averageValue}/${averageValue2 || 'N/A'} ${getSelectedValueType()?.unit || 'mmHg'}`
                            ) : (
                              `${averageValue} ${getSelectedValueType()?.unit || 'mmol/L'}`
                            )}
                          </Typography>
                        </Box>
                        {/* Move High/Low label below mmol/L */}
                        <Box sx={{ mt: 1 }}>
                          <Chip label={averageStatus.label} color={averageStatus.color} size="small" />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {t('basedOnReadings', { count: filteredRecords.length })}
                        </Typography>
                      </CardContent>
                    </Card>
                    <Card elevation={3} sx={{ flex: 1 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {t('totalRecords')}
                        </Typography>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                          {filteredRecords.length}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {getLocalizedValueTypeName(getSelectedValueType()) || t('bloodSugarMeasurements')}
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
                              <TableCell><strong>{getLocalizedValueTypeName(getSelectedValueType()) || t('bloodSugarValue')}</strong></TableCell>
                              <TableCell><strong>{t('status')}</strong></TableCell>
                              <TableCell><strong>{t('trend')}</strong></TableCell>
                              <TableCell><strong>{t('notes')}</strong></TableCell>
                              <TableCell><strong>{t('actions')}</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody data-testid="blood-sugar-records">
                            {filteredRecords
                              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                              .map((record, index) => {
                              const status = getBloodSugarStatus(record.value);
                              const actualIndex = page * rowsPerPage + index;
                              return (
                                <TableRow key={record.id} hover>
                                  <TableCell>
                                    {formatDateTime(record.measurementTime)}
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {requiresTwoValues() && record.value2 ? (
                                        `${record.value}/${record.value2} ${getSelectedValueType()?.unit || 'mmHg'}`
                                      ) : (
                                        `${record.value} ${getSelectedValueType()?.unit || 'mmol/L'}`
                                      )}
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
                                      <IconButton onClick={() => handleEdit(record)} color="primary" data-testid="edit-record-button">
                                        <EditIcon />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={t('delete')}>
                                      <IconButton onClick={() => handleDelete(record.id)} color="error" data-testid="delete-record-button">
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
                                                      count={filteredRecords.length}
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
                      {filteredRecords.length > 0 ? (
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
                              <RechartsTooltip 
                                formatter={(value, name, props) => {
                                  if (name === 'value') {
                                    return [
                                      value ? `${value} ${getSelectedValueType()?.unit || 'mmol/L'}` : t('noData'), 
                                      requiresTwoValues() ? t('systolicPressure') : t('average')
                                    ];
                                  }
                                  if (name === 'value2') {
                                    return [
                                      value ? `${value} ${getSelectedValueType()?.unit2 || 'mmHg'}` : t('noData'), 
                                      t('diastolicPressure')
                                    ];
                                  }
                                  return [value, name];
                                }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#1976d2" 
                                strokeWidth={3}
                                dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                                name={requiresTwoValues() ? t('systolicPressure') : t('average')}
                              />
                              {requiresTwoValues() && (
                                <Line 
                                  type="monotone" 
                                  dataKey="value2" 
                                  stroke="#ff6b35" 
                                  strokeWidth={3}
                                  dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                                  name={t('diastolicPressure')}
                                />
                              )}
                            </LineChart>
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
                                  if (name === 'value') {
                                    return [
                                      value ? `${value} ${getSelectedValueType()?.unit || 'mmol/L'}` : t('noData'), 
                                      requiresTwoValues() ? t('systolicPressure') : t('average')
                                    ];
                                  }
                                  if (name === 'value2') {
                                    return [
                                      value ? `${value} ${getSelectedValueType()?.unit2 || 'mmHg'}` : t('noData'), 
                                      t('diastolicPressure')
                                    ];
                                  }
                                  return [value, name];
                                }}
                                labelFormatter={(label) => `${label}:00`}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#ff6b35" 
                                strokeWidth={3}
                                dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
                                connectNulls={true}
                                name={requiresTwoValues() ? t('systolicPressure') : t('average')}
                              />
                              {requiresTwoValues() && (
                                <Line 
                                  type="monotone" 
                                  dataKey="value2" 
                                  stroke="#1976d2" 
                                  strokeWidth={3}
                                  dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                                  connectNulls={true}
                                  name={t('diastolicPressure')}
                                />
                              )}
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
                          label={requiresTwoValues() ? t('systolicPressure') : t('medicalRecordLabel')}
                          type="text"
                          name="value"
                          value={currentRecord.value ?? ''}
                          onChange={handleInputChange}
                          required
                          margin="normal"
                          inputProps={{
                            inputMode: 'decimal',
                            autoComplete: 'off',
                            autoCorrect: 'off',
                            autoCapitalize: 'off',
                            spellCheck: 'false'
                          }}
                        />
                        {requiresTwoValues() && (
                          <TextField
                            fullWidth
                            label={t('diastolicPressure')}
                            type="text"
                            name="value2"
                            value={currentRecord.value2 ?? ''}
                            onChange={handleInputChange}
                            required
                            margin="normal"
                            inputProps={{
                              inputMode: 'decimal',
                              autoComplete: 'off',
                              autoCorrect: 'off',
                              autoCapitalize: 'off',
                              spellCheck: 'false'
                            }}
                          />
                        )}
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
              label={requiresTwoValues() ? t('systolicPressure') : t('medicalRecordLabel')}
              type="text"
              name="value"
              value={currentRecord.value ?? ''}
              onChange={handleInputChange}
              required
              margin="normal"
              inputProps={{
                inputMode: 'decimal',
                autoComplete: 'off',
                autoCorrect: 'off',
                autoCapitalize: 'off',
                spellCheck: 'false'
              }}
            />
            {requiresTwoValues() && (
              <TextField
                fullWidth
                label={t('diastolicPressure')}
                type="text"
                name="value2"
                value={currentRecord.value2 ?? ''}
                onChange={handleInputChange}
                required
                margin="normal"
                inputProps={{
                  inputMode: 'decimal',
                  autoComplete: 'off',
                  autoCorrect: 'off',
                  autoCapitalize: 'off',
                  spellCheck: 'false'
                }}
              />
            )}
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
          <Button onClick={handleSubmit} variant="contained" data-testid={isEditing ? "save-record-button" : "add-new-record-button"}>
            {isEditing ? t('update') : t('addRecordButton')}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default Dashboard; 