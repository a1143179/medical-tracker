import React, { useState, useEffect } from 'react';
import { Alert, ProgressBar, Badge } from 'react-bootstrap';
import { useLanguage } from '../contexts/LanguageContext';
import emailService from '../services/emailService';

const EmailUsageMonitor = () => {
  const { t } = useLanguage();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const usageData = await emailService.getEmailUsage();
        setUsage(usageData);
      } catch (err) {
        setError(t('failedToLoadEmailUsage'));
        console.error('Usage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, [t]);

  if (loading) {
    return <Alert variant="info">{t('loadingEmailUsage')}</Alert>;
  }

  if (error) {
    return <Alert variant="warning">{error}</Alert>;
  }

  if (!usage) {
    return null;
  }

  const { sent, limit, remaining, resetTime } = usage;
  const percentage = (sent / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getVariant = () => {
    if (isAtLimit) return 'danger';
    if (isNearLimit) return 'warning';
    return 'success';
  };

  const formatResetTime = (timestamp) => {
    if (!timestamp) return t('unknown');
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Alert variant={getVariant()} className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">
          <i className="fas fa-envelope me-2"></i>
          {t('emailUsageToday')}
        </h6>
        <Badge bg={getVariant()}>
          {t('emailsSent', { sent, limit })}
        </Badge>
      </div>
      
      <ProgressBar 
        variant={getVariant()} 
        now={percentage} 
        className="mb-2"
        label={`${Math.round(percentage)}%`}
      />
      
      <div className="d-flex justify-content-between align-items-center">
        <small className="text-muted">
          {t('emailsRemaining', { remaining })}
        </small>
        <small className="text-muted">
          {t('resetsAt', { time: formatResetTime(resetTime) })}
        </small>
      </div>
      
      {isNearLimit && !isAtLimit && (
        <Alert variant="warning" className="mt-2 mb-0 py-2">
          <small>
            <i className="fas fa-exclamation-triangle me-1"></i>
            {t('approachingEmailLimit')}
          </small>
        </Alert>
      )}
      
      {isAtLimit && (
        <Alert variant="danger" className="mt-2 mb-0 py-2">
          <small>
            <i className="fas fa-ban me-1"></i>
            {t('emailLimitReached')}
          </small>
        </Alert>
      )}
    </Alert>
  );
};

export default EmailUsageMonitor; 