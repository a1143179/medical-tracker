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
      appTitle: 'Blood Sugar Tracker',
      
      // Navigation
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      addNewRecord: 'Add New Record',
      records: 'Records',
      
      // Dashboard Cards
      latestReading: 'Latest Reading',
      averageLevel: 'Average Level',
      totalRecords: 'Total Records',
      noData: 'No data',
      basedOnReadings: 'Based on {count} readings',
      bloodSugarMeasurements: 'Blood sugar measurements',
      
      // Records Table
      bloodSugarRecords: 'Blood Sugar Records',
      addRecord: 'Add New Record',
      dateTime: 'Date & Time',
      bloodSugarLevel: 'Blood Sugar (mmol/L)',
      status: 'Status',
      trend: 'Trend',
      notes: 'Notes',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      recordsPerPage: 'Records per page:',
      ofRecords: '{from}-{to} of {count}',
      
      // Analytics
      bloodSugarTrends: 'Blood Sugar Trends',
      recentReadings: 'Recent Readings',
      hour24Average: 'Daily Pattern (Hourly Averages)',
      average: 'Average',
      day: 'Day',
      noDataForAnalytics: 'No data available for analytics',
      addRecordsForCharts: 'Add some blood sugar records to see charts and analytics',
      
      // Add/Edit Record
      addNewBloodSugarRecord: 'Add New Blood Sugar Record',
      editBloodSugarRecord: 'Edit Blood Sugar Record',
      dateTimeLabel: 'Date & Time',
      bloodSugarLevelLabel: 'Blood Sugar Level (mmol/L)',
      enterBloodSugarReading: 'Enter your blood sugar reading',
      notesLabel: 'Notes',
      optionalNotes: 'Optional notes about this reading',
      cancel: 'Cancel',
      update: 'Update',
      addRecordButton: 'Add New Record',
      
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
      sendVerificationCode: 'Send Verification Code',
      verificationCode: 'Verification Code',
      verifyCode: 'Verify Code',
      resendCode: 'Resend Code',
      resendInSeconds: 'Resend ({seconds}s)',
      enterEmailFirst: 'Please enter your email address first',
      emailVerifiedSuccessfully: 'Email verified successfully!',
      emailVerifiedSetPassword: 'Email verified! Now set your password',
      passwordMinLength: 'Password must be at least 6 characters long',
      passwordsDoNotMatch: 'Passwords do not match',
      passwordTooShort: 'Password must be at least 6 characters long',
      userAlreadyExists: 'User with this email already exists',
      invalidEmailOrPassword: 'Invalid email or password',
      registrationSuccessful: 'Registration successful! You can now log in.',
      verificationCodeSent: 'Verification code sent',
      enterVerificationCode: 'Enter the 6-digit verification code sent to {email}',
      sending: 'Sending...',
      yourDataIsSecure: 'Your data is secure and private. We only store your basic account information.',
      enterEmail: 'Enter Email',
      verifyEmail: 'Verify Email',
      setPassword: 'Set Password',
      appDescription: 'Track your blood sugar levels and monitor your health with our comprehensive dashboard.',
      appInitials: 'BS',
      
      // Email Usage Monitor
      emailUsageToday: 'Email Usage Today',
      emailsSent: '{sent}/{limit} emails',
      emailsRemaining: '{remaining} emails remaining',
      resetsAt: 'Resets: {time}',
      unknown: 'Unknown',
      loadingEmailUsage: 'Loading email usage...',
      failedToLoadEmailUsage: 'Failed to load email usage',
      approachingEmailLimit: "You're approaching the daily email limit. Consider upgrading your plan.",
      emailLimitReached: 'Daily email limit reached. Emails will be blocked until tomorrow.',
      
      // Common
      loading: 'Loading...',
      
      // Forgot Password
      forgotPassword: 'Forgot Password?',
      enterEmailForReset: 'Enter your email address to receive a reset code',
      sendResetCode: 'Send Reset Code',
      resetPassword: 'Reset Password',
      enterResetCodeAndPassword: 'Enter the reset code and your new password',
      resetCode: 'Reset Code',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      passwordResetSuccess: 'Password Reset Successful',
      passwordResetSuccessMessage: 'Your password has been reset successfully. You can now log in with your new password.',
      backToLogin: 'Back to Login',
      back: 'Back',

      // Login Page Specific
      whatYoullGet: "What you'll get:",
      trackBloodSugar: 'Track blood sugar levels with precision',
      viewTrends: 'View trends and analytics',
      exportData: 'Export data for healthcare providers',
      welcomeBack: 'Welcome Back',
      signInToAccess: 'Sign in to access your personalized blood sugar tracking dashboard',
      signInWithGoogle: 'Sign in with Google',
      rememberMe: 'Keep me signed in for 30 days',
      secureAuth: 'Secure authentication powered by Google',
      byContinuing: 'By continuing, you agree to our',
      termsOfService: 'Terms of Service',
      and: 'and',
      privacyPolicy: 'Privacy Policy',
    },
    zh: {
      // App Bar
      appTitle: '血糖追踪器',
      
      // Navigation
      dashboard: '仪表板',
      analytics: '分析',
      addNewRecord: '添加新记录',
      records: '记录',
      
      // Dashboard Cards
      latestReading: '最新读数',
      averageLevel: '平均水平',
      totalRecords: '总记录数',
      noData: '无数据',
      basedOnReadings: '基于 {count} 次读数',
      bloodSugarMeasurements: '血糖测量',
      
      // Records Table
      bloodSugarRecords: '血糖记录',
      addRecord: '添加新记录',
      dateTime: '日期和时间',
      bloodSugarLevel: '血糖 (mmol/L)',
      status: '状态',
      trend: '趋势',
      notes: '备注',
      actions: '操作',
      edit: '编辑',
      delete: '删除',
      recordsPerPage: '每页记录数:',
      ofRecords: '第 {from}-{to} 条，共 {count} 条',
      
      // Analytics
      bloodSugarTrends: '血糖趋势',
      recentReadings: '最近读数',
      hour24Average: '每日模式 (小时平均值)',
      average: '平均值',
      day: '天',
      noDataForAnalytics: '暂无分析数据',
      addRecordsForCharts: '添加一些血糖记录以查看图表和分析',
      
      // Add/Edit Record
      addNewBloodSugarRecord: '添加新血糖记录',
      editBloodSugarRecord: '编辑血糖记录',
      dateTimeLabel: '日期和时间',
      bloodSugarLevelLabel: '血糖水平 (mmol/L)',
      enterBloodSugarReading: '输入您的血糖读数',
      notesLabel: '备注',
      optionalNotes: '关于此读数的可选备注',
      cancel: '取消',
      update: '更新',
      addRecordButton: '添加新记录',
      
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
      sendVerificationCode: '发送验证码',
      verificationCode: '验证码',
      verifyCode: '验证',
      resendCode: '重新发送',
      resendInSeconds: '重新发送 ({seconds}s)',
      enterEmailFirst: '请先输入您的邮箱地址',
      emailVerifiedSuccessfully: '邮箱验证成功！',
      emailVerifiedSetPassword: '邮箱已验证！现在设置您的密码',
      passwordMinLength: '密码至少需要6个字符',
      passwordsDoNotMatch: '密码不匹配',
      passwordTooShort: '密码至少需要6个字符',
      userAlreadyExists: '该邮箱的用户已存在',
      invalidEmailOrPassword: '邮箱或密码无效',
      registrationSuccessful: '注册成功！您现在可以登录了。',
      verificationCodeSent: '验证码已发送',
      enterVerificationCode: '请输入发送到 {email} 的6位验证码',
      sending: '发送中...',
      yourDataIsSecure: '您的数据是安全且私密的。我们只存储您的基本账户信息。',
      enterEmail: '输入邮箱',
      verifyEmail: '验证邮箱',
      setPassword: '设置密码',
      appDescription: '追踪您的血糖水平并通过我们的综合仪表板监控您的健康状况。',
      appInitials: '血糖',
      
      // Email Usage Monitor
      emailUsageToday: '今日邮件使用量',
      emailsSent: '{sent}/{limit} 封邮件',
      emailsRemaining: '剩余 {remaining} 封邮件',
      resetsAt: '重置时间: {time}',
      unknown: '未知',
      loadingEmailUsage: '正在加载邮件使用量...',
      failedToLoadEmailUsage: '加载邮件使用量失败',
      approachingEmailLimit: '您正在接近每日邮件限制。请考虑升级您的计划。',
      emailLimitReached: '已达到每日邮件限制。邮件将被阻止直到明天。',
      
      // Common
      loading: '加载中...',
      
      // Forgot Password
      forgotPassword: '忘记密码？',
      enterEmailForReset: '输入您的邮箱地址以接收重置代码',
      sendResetCode: '发送重置代码',
      resetPassword: '重置密码',
      enterResetCodeAndPassword: '输入重置代码和您的新密码',
      resetCode: '重置代码',
      newPassword: '新密码',
      confirmNewPassword: '确认新密码',
      passwordResetSuccess: '密码重置成功',
      passwordResetSuccessMessage: '您的密码已成功重置。您现在可以使用新密码登录。',
      backToLogin: '返回登录',
      back: '返回',

      // Login Page Specific
      whatYoullGet: '您将获得：',
      trackBloodSugar: '精准追踪血糖水平',
      viewTrends: '查看趋势和分析',
      exportData: '导出数据供医疗人员使用',
      welcomeBack: '欢迎回来',
      signInToAccess: '登录以访问您的个性化血糖追踪仪表板',
      signInWithGoogle: '使用 Google 登录',
      rememberMe: '保持登录状态30天',
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