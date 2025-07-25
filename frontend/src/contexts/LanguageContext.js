import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('languagePreference');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'zh' || savedLanguage === 'es' || savedLanguage === 'fr')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Listen for user login events to load language preference from backend
  useEffect(() => {
    const handleUserLogin = async (event) => {
      setIsAuthenticated(true);
      await loadLanguagePreference();
    };

    const handleUserLogout = () => {
      setIsAuthenticated(false);
      // Keep the current language preference in localStorage for non-authenticated users
    };

    window.addEventListener('userLoggedIn', handleUserLogin);
    window.addEventListener('userLoggedOut', handleUserLogout);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLogin);
      window.removeEventListener('userLoggedOut', handleUserLogout);
    };
  }, []);

  const setLanguage = async (newLanguage) => {
    setLanguageState(newLanguage);
    
    // Always save to localStorage for non-authenticated users
    localStorage.setItem('languagePreference', newLanguage);
    
    // If user is authenticated, also save to backend (source of truth)
    if (isAuthenticated) {
      try {
        await fetch('/api/auth/language-preference', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ languagePreference: newLanguage })
        });
      } catch (error) {
        console.error('Could not save language preference to backend:', error.message);
        // Even if backend save fails, keep the change in localStorage
      }
    }
  };

  // Function to load language preference from backend
  const loadLanguagePreference = async () => {
    try {
      const response = await fetch('/api/auth/language-preference', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setLanguageState(data.languagePreference);
        localStorage.setItem('languagePreference', data.languagePreference);
      } else {
        // If backend doesn't have a preference, check if we have one in localStorage
        // This handles the case where a user registered and we need to transfer their preference
        const localPreference = localStorage.getItem('languagePreference');
        if (localPreference && (localPreference === 'en' || localPreference === 'zh' || localPreference === 'es' || localPreference === 'fr')) {
          // Transfer localStorage preference to backend
          try {
            await fetch('/api/auth/language-preference', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ languagePreference: localPreference })
            });
            // Keep the current preference in state
            setLanguageState(localPreference);
          } catch (error) {
            console.error('Could not transfer language preference to backend:', error.message);
            // Keep using localStorage preference
            setLanguageState(localPreference);
          }
        }
      }
    } catch (error) {
      console.error('Could not load language preference from backend:', error.message);
      // Fallback to localStorage preference
      const localPreference = localStorage.getItem('languagePreference');
      if (localPreference && (localPreference === 'en' || localPreference === 'zh' || localPreference === 'es' || localPreference === 'fr')) {
        setLanguageState(localPreference);
      }
    }
  };

  const translations = {
    en: {
      // App Bar
      appTitle: 'Medical Tracker',
      
      // Navigation
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      addNewRecord: 'Add New Record',
      records: 'Records',
      
      // Dashboard Cards
      latestReading: 'Latest Reading',
      highestReading: 'Highest Reading',
      lowestReading: 'Lowest Reading',
      averageValue: 'Average Value',
      totalRecords: 'Total Records',
      noData: 'No data',
      basedOnReadings: 'Based on {count} readings',
      bloodSugarMeasurements: 'Medical Measurements',
      
      // Records Table
      bloodSugarRecords: 'Medical Records',
      addRecord: 'Add New Record',
      dateTime: 'Date & Time',
      bloodSugarValue: 'Medical Value (mmol/L)',
      status: 'Status',
      trend: 'Trend',
      notes: 'Notes',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      recordsPerPage: 'Records per page:',
      ofRecords: '{from}-{to} of {count}',
      
      // Analytics
      bloodSugarTrends: 'Medical Trends',
      recentReadings: 'Recent Readings',
      hour24Average: 'Daily Pattern (Hourly Averages)',
      average: 'Average',
      day: 'Day',
      noDataForAnalytics: 'No data available for analytics',
      addRecordsForCharts: 'Add some medical records to see charts and analytics',
      
      // Add/Edit Record
      addNewBloodSugarRecord: 'Add New Medical Record',
      editBloodSugarRecord: 'Edit Medical Record',
      dateTimeLabel: 'Date & Time',
      bloodSugarValueLabel: 'Medical Value (mmol/L)',
      enterBloodSugarReading: 'Enter your medical value',
      medicalRecordLabel: 'Medical Record',
      notesLabel: 'Notes',
      optionalNotes: 'Optional notes about this reading',
      cancel: 'Cancel',
      update: 'Update',
      addRecordButton: 'Add New Record',
      medicalValueTypeLabel: 'Medical Value Type',
      diastolicPressure: 'Diastolic Pressure',
      systolicPressure: 'Systolic Pressure',
      
      // Status Labels
      low: 'Low',
      high: 'High',
      elevated: 'Elevated',
      normal: 'Normal',
      
      // Messages
      recordAddedSuccessfully: 'Record added successfully',
      recordUpdatedSuccessfully: 'Record updated successfully',
      recordDeletedSuccessfully: 'Record deleted successfully',
      failedToFetchRecords: 'Failed to fetch records',
      failedToSaveRecord: 'Failed to save record',
      failedToDeleteRecord: 'Failed to delete record',
      userNotAuthenticated: 'User not authenticated',
      confirmDelete: 'Are you sure you want to delete this record?',
      
      // Language Switcher
      language: 'Language',
      english: 'English',
      chinese: '中文',
      spanish: 'Español',
      french: 'Français',
      save: 'Save',
      languageSavedSuccessfully: 'Language saved successfully',
      failedToSaveLanguage: 'Failed to save language preference',
      
      // Header
      logout: 'Logout',
      welcome: 'Welcome,',
      
      // Login/Register
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      rememberPassword: 'Remember Password',
      signIn: 'Sign In',
      createAccount: 'Create Account',
      passwordMinLength: 'Password must be at least 6 characters long',
      passwordsDoNotMatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters long',
      userAlreadyExists: 'User with this email already exists',
      invalidEmailOrPassword: 'Invalid email or password',
      registrationSuccessful: 'Registration successful! You can now log in.',
      sending: 'Sending...',
      yourDataIsSecure: 'Your data is secure and private. We only store your basic account information.',
      appDescription: 'Track your medical values and monitor your health with our comprehensive dashboard.',
      appInitials: 'BS',
      
      resetsAt: 'Resets: {time}',
      unknown: 'Unknown',
      
      // Common
      loading: 'Loading...',
      
      back: 'Back',

      // Login Page Specific
      whatYoullGet: "What you'll get here:",
      trackBloodSugar: 'Track medical values with precision',
      viewTrends: 'View trends and analytics',
      exportData: 'Export data for healthcare providers',
      welcomeBack: 'Welcome Back',
      signInToAccess: 'Sign in to access your personalized medical tracking dashboard',
      signInWithGoogle: 'Sign in with Google',
      rememberMe: 'Keep me signed in for 365 days',
      secureAuth: 'Secure authentication powered by Google',
      byContinuing: 'By continuing, you agree to our',
      termsOfService: 'Terms of Service',
      and: 'and',
      privacyPolicy: 'Privacy Policy',
    },
    zh: {
      // App Bar
      appTitle: 'Medical Tracker',
      
      // Navigation
      dashboard: '仪表板',
      analytics: '分析',
      addNewRecord: '添加新记录',
      records: '记录',
      
      // Dashboard Cards
      latestReading: '最新读数',
      highestReading: '最高读数',
      lowestReading: '最低读数',
      averageValue: '平均值',
      totalRecords: '总记录数',
      noData: '无数据',
      basedOnReadings: '基于 {count} 次读数',
      bloodSugarMeasurements: 'Medical Measurements',
      
      // Records Table
      bloodSugarRecords: 'Medical Records',
      addRecord: '添加新记录',
      dateTime: '日期和时间',
      bloodSugarValue: 'Medical Value (mmol/L)',
      status: '状态',
      trend: '趋势',
      notes: '备注',
      actions: '操作',
      edit: '编辑',
      delete: '删除',
      recordsPerPage: '每页记录数:',
      ofRecords: '第 {from}-{to} 条，共 {count} 条',
      
      // Analytics
      bloodSugarTrends: 'Medical Trends',
      recentReadings: '最近读数',
      hour24Average: '每日模式 (小时平均值)',
      average: '平均值',
      day: '天',
      noDataForAnalytics: '暂无分析数据',
      addRecordsForCharts: '添加一些血糖记录以查看图表和分析',
      
      // Add/Edit Record
      addNewBloodSugarRecord: '添加新医疗记录',
      editBloodSugarRecord: '编辑医疗记录',
      dateTimeLabel: '日期和时间',
      bloodSugarValueLabel: 'Medical Value (mmol/L)',
      enterBloodSugarReading: '输入您的医疗数值',
      medicalRecordLabel: '医疗记录',
      notesLabel: '备注',
      optionalNotes: '关于此读数的可选备注',
      cancel: '取消',
      update: '更新',
      addRecordButton: '添加新记录',
      medicalValueTypeLabel: '医疗数据类型',
      diastolicPressure: '舒张压',
      systolicPressure: '收缩压',
      
      // Status Labels
      low: '低',
      high: '高',
      elevated: '偏高',
      normal: '正常',
      
      // Messages
      recordAddedSuccessfully: '记录添加成功',
      recordUpdatedSuccessfully: '记录更新成功',
      recordDeletedSuccessfully: '记录删除成功',
      failedToFetchRecords: '获取记录失败',
      failedToSaveRecord: '保存记录失败',
      failedToDeleteRecord: '删除记录失败',
      userNotAuthenticated: '用户未认证',
      confirmDelete: '您确定要删除此记录吗？',
      
      // Language Switcher
      language: 'Language',
      english: 'English',
      chinese: '中文',
      save: '保存',
      languageSavedSuccessfully: '语言设置保存成功',
      failedToSaveLanguage: '保存语言设置失败',
      
      // Header
      logout: '退出登录',
      welcome: '欢迎,',
      
      // Login/Register
      login: '登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      rememberPassword: '记住密码',
      signIn: '登录',
      createAccount: '创建账户',
      passwordMinLength: '密码至少需要6个字符',
      passwordsDoNotMatch: '密码不匹配',
      passwordTooShort: '密码至少需要6个字符',
      userAlreadyExists: '该邮箱的用户已存在',
      invalidEmailOrPassword: '邮箱或密码无效',
      registrationSuccessful: '注册成功！您现在可以登录了。',
      sending: '发送中...',
      yourDataIsSecure: '您的数据是安全且私密的。我们只存储您的基本账户信息。',
      appDescription: '追踪您的医疗数值并通过我们的综合仪表板监控您的健康状况。',
      appInitials: '血糖',
      
      resetsAt: '重置时间: {time}',
      unknown: '未知',
      
      // Common
      loading: '加载中...',
      
      back: '返回',

      // Login Page Specific
      whatYoullGet: '您将获得：',
      trackBloodSugar: '精准追踪血糖水平',
      viewTrends: '查看趋势和分析',
      exportData: '导出数据供医疗人员使用',
      welcomeBack: '欢迎回来',
      signInToAccess: '登录以访问您的个性化血糖追踪仪表板',
      signInWithGoogle: '使用 Google 登录',
      rememberMe: '保持登录状态365天',
      secureAuth: '由 Google 提供安全认证',
      byContinuing: '继续即表示您同意我们的',
      termsOfService: '服务条款',
      and: '和',
      privacyPolicy: '隐私政策',
    }
  };

  const t = (key, params = {}) => {
    // Ensure translations and language are available
    if (!translations || !translations[language]) {
      console.warn('Translations not available, falling back to key:', key);
      return key;
    }
    
    let text = translations[language][key] || key;
    
    // Replace parameters in the text
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  };

  // Function to sync authentication state
  const syncAuthState = (authenticated) => {
    setIsAuthenticated(authenticated);
  };

  const value = {
    language,
    setLanguage,
    loadLanguagePreference,
    syncAuthState,
    t,
    translations
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 