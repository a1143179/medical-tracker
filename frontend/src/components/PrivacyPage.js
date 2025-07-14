import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const PrivacyPage = () => (
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Typography variant="h4" gutterBottom>Privacy Policy</Typography>
    <Box sx={{ mt: 2 }}>
      <Typography variant="body1" paragraph>
        Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use Blood Sugar Tracker.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>1. Information We Collect</Typography>
      <Typography variant="body1" paragraph>
        We collect information you provide directly, such as when you register, log in, or add blood sugar records. We may also collect technical information about your device and usage.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>2. How We Use Information</Typography>
      <Typography variant="body1" paragraph>
        We use your information to provide, maintain, and improve the application, and to communicate with you about your account and updates.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>3. Data Security</Typography>
      <Typography variant="body1" paragraph>
        We implement reasonable security measures to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>4. Sharing of Information</Typography>
      <Typography variant="body1" paragraph>
        We do not sell or rent your personal information. We may share information with service providers as necessary to operate the application, or as required by law.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>5. Cookies</Typography>
      <Typography variant="body1" paragraph>
        We may use cookies and similar technologies to enhance your experience and analyze usage.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>6. Changes to This Policy</Typography>
      <Typography variant="body1" paragraph>
        We may update this Privacy Policy from time to time. Changes will be posted in the application and are effective immediately.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>7. Contact Us</Typography>
      <Typography variant="body1" paragraph>
        If you have any questions about this Privacy Policy, please contact us at support@bloodsugartracker.com.
      </Typography>
    </Box>
  </Container>
);

export default PrivacyPage; 