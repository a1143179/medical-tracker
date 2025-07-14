# Medical Tracker Frontend

A React-based frontend application for tracking blood sugar levels with Google OAuth authentication, responsive design, and comprehensive data visualization.

## Features

- **Google OAuth Login**: Secure authentication using Google accounts
- **Blood Sugar Tracking**: Add, edit, and delete blood sugar readings
- **Data Visualization**: Charts and analytics for blood sugar trends
- **Responsive Design**: Mobile-first design that works on all devices
- **Multi-language Support**: Internationalization with language preferences
- **Real-time Updates**: Live data synchronization with backend
- **Offline Support**: Progressive Web App capabilities
- **Dark/Light Theme**: User preference-based theming
- **Privacy & Terms**: Built-in privacy policy and terms of service pages

## Technology Stack

- **React 18**: Modern React with hooks and functional components
- **Material-UI (MUI)**: Component library for consistent UI
- **React Router**: Client-side routing
- **Axios**: HTTP client for API communication
- **Chart.js**: Data visualization and charts
- **JWT**: Token-based authentication
- **Context API**: State management
- **CSS Modules**: Scoped styling
- **Docker**: Containerization support

## Prerequisites

- Node.js 18+ and npm
- Modern web browser
- Backend API running (see medical-tracker-backend)
- Google OAuth credentials

## Environment Setup

Create a `.env.development` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:55556
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_APP_NAME=Medical Tracker
```

## Local Development

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:55555`

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App
- `npm run cypress:open` - Open Cypress test runner
- `npm run cypress:run` - Run Cypress tests headlessly

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Dashboard.js     # Main dashboard component
│   ├── GoogleLogin.js   # Login component
│   ├── Header.js        # Navigation header
│   └── ...
├── contexts/            # React contexts
│   ├── AuthContext.js   # Authentication state
│   └── LanguageContext.js # Language preferences
├── services/            # API and external services
│   └── api.js          # API client
├── config/              # Configuration files
│   └── environment.js   # Environment configuration
└── ...
```

## Key Components

### Dashboard
- Blood sugar record management
- Data visualization with charts
- Add/edit/delete functionality
- Responsive grid layout

### GoogleLogin
- OAuth authentication flow
- Loading states and error handling
- Responsive design

### Header
- Navigation menu
- User profile information
- Language selector
- Logout functionality

## API Integration

The frontend communicates with the backend API through the `api.js` service:

```javascript
// Example API calls
import api from '../services/api';

// Get blood sugar records
const records = await api.get('/api/records');

// Add new record
const newRecord = await api.post('/api/records', {
  level: 120,
  date: new Date(),
  notes: 'After breakfast'
});
```

## Authentication Flow

1. User clicks "Login with Google"
2. Redirected to Google OAuth
3. Google redirects back with authorization code
4. Backend exchanges code for user info and JWT token
5. Frontend receives JWT token in HTTP-only cookie
6. User is authenticated and redirected to dashboard

## Styling

The application uses Material-UI components with custom theming:

```javascript
// Theme configuration
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
```

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests (Cypress)
```bash
# Open Cypress
npm run cypress:open

# Run headlessly
npm run cypress:run
```

### Test Coverage
```bash
npm test -- --coverage --watchAll=false
```

## Docker Deployment

### Build Image
```bash
docker build -t medical-tracker-frontend .
```

### Run Container
```bash
docker run -p 55555:80 medical-tracker-frontend
```

## Production Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `REACT_APP_APP_NAME` - Application name

### Azure Static Web Apps
1. Connect repository to Azure Static Web Apps
2. Configure build settings
3. Set environment variables
4. Deploy automatically on push to main branch

## Performance Optimization

- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Compressed and optimized images
- **Bundle Analysis**: Webpack bundle analyzer
- **Caching**: Service worker for offline support
- **Minification**: Production builds are minified

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## Security Features

- JWT token validation
- XSS protection
- CSRF protection
- Secure cookie handling
- Input sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Code Style

- ESLint configuration
- Prettier formatting
- Consistent naming conventions
- Component documentation

## Troubleshooting

### Common Issues

1. **Port already in use**: Change port in package.json or kill existing process
2. **CORS errors**: Ensure backend CORS is configured correctly
3. **OAuth errors**: Verify Google OAuth credentials and redirect URIs
4. **Build failures**: Clear node_modules and reinstall dependencies

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start
```

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository. 