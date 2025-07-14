import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const TermsPage = () => (
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Typography variant="h4" gutterBottom>Terms and Conditions</Typography>
    <Box sx={{ mt: 2 }}>
      <Typography variant="body1" paragraph>
        Welcome to Blood Sugar Tracker. By accessing or using our application, you agree to be bound by these Terms and Conditions. Please read them carefully.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>1. Acceptance of Terms</Typography>
      <Typography variant="body1" paragraph>
        By using this application, you agree to comply with and be legally bound by these terms. If you do not agree, please do not use the application.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>2. Use of the Application</Typography>
      <Typography variant="body1" paragraph>
        You may use the application only for lawful purposes and in accordance with these terms. You are responsible for your use of the application and for any content you provide.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>3. Privacy</Typography>
      <Typography variant="body1" paragraph>
        Your use of the application is also governed by our Privacy Policy. Please review it to understand our practices.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>4. Intellectual Property</Typography>
      <Typography variant="body1" paragraph>
        All content, features, and functionality in this application are the exclusive property of Blood Sugar Tracker and its licensors.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>5. Disclaimer</Typography>
      <Typography variant="body1" paragraph>
        The application is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, express or implied, regarding the application.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>6. Limitation of Liability</Typography>
      <Typography variant="body1" paragraph>
        To the fullest extent permitted by law, Blood Sugar Tracker shall not be liable for any damages arising from your use of the application.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>7. Changes to Terms</Typography>
      <Typography variant="body1" paragraph>
        We reserve the right to modify these terms at any time. Changes will be effective upon posting to the application.
      </Typography>
      <Typography variant="h6" sx={{ mt: 2 }}>8. Contact Us</Typography>
      <Typography variant="body1" paragraph>
        If you have any questions about these Terms and Conditions, please contact us at support@bloodsugartracker.com.
      </Typography>
    </Box>
  </Container>
);

export default TermsPage; 