# Blood Sugar Tracker Frontend

A React-based single page application for tracking blood sugar levels with Google OAuth authentication.

## Features

- **Single Page Application (SPA)**: Built with React Router for seamless navigation
- **Google OAuth Authentication**: Secure login using Google accounts
- **Blood Sugar Tracking**: Add, edit, and delete blood sugar records
- **Analytics Dashboard**: Visual charts and statistics
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: AJAX-based data operations
- **Multi-language Support**: English and Chinese language options

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google OAuth

You need to set up Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback` (development)
   - `https://yourdomain.com/api/auth/callback` (production)

### 3. Set Environment Variables

Create a `.env` file in the backend directory:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Start the Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Application Structure

```
src/
├── components/
│   ├── Dashboard.js      # Main blood sugar tracking interface
│   ├── Header.js         # Navigation header with user info
│   ├── GoogleLogin.js    # Google OAuth login page
│   └── ProtectedRoute.js # Route protection component
├── contexts/
│   ├── AuthContext.js    # Authentication state management
│   └── LanguageContext.js # Language preference management
└── App.js               # Main application with routing
```

## Authentication Flow

### Google OAuth Login Process
1. **Sign in with Google**: User clicks "Sign in with Google" button
2. **Google OAuth**: User is redirected to Google for authentication
3. **Account Creation**: Backend automatically creates/updates user account
4. **Session Establishment**: User session is created and maintained
5. **Dashboard Access**: User is redirected to the main dashboard

### User Experience Features
- **One-Click Login**: Simple Google OAuth integration
- **Automatic Account Creation**: No manual registration required
- **Secure Authentication**: Leverages Google's security infrastructure
- **Email Verification**: Google accounts are pre-verified
- **Session Management**: Secure server-side session handling

## User Interface

### Google Login Page
- **Clean Design**: Modern, minimalist login interface
- **Google Branding**: Official Google sign-in button
- **Responsive Layout**: Works on all device sizes
- **Error Handling**: Graceful error message display

### Dashboard
- **User-Specific Records**: Each user only sees their own blood sugar records
- **Secure Data Access**: Users can only view, edit, and delete their own data
- **Real-time Updates**: Changes are immediately reflected in the interface
- **Data Privacy**: Complete isolation between user accounts

### Data Security
- **Google OAuth**: Secure authentication via Google
- **User Authentication**: All records are tied to authenticated users
- **API Protection**: Backend validates user ownership before any operations
- **Data Isolation**: Users cannot access other users' records
- **Session Management**: Secure server-side user sessions

## API Integration

The frontend communicates with the backend API for:
- **Authentication**: `/api/auth/*` endpoints for OAuth flow
- **Blood Sugar Records**: `/api/records` for CRUD operations
- **User Management**: `/api/auth/me` for user info
- **Language Preferences**: `/api/auth/language` for language settings

All API calls use AJAX (fetch API) for seamless user experience.

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run cypress:open` - Open Cypress test runner
- `npm run cypress:run` - Run Cypress tests headlessly

### Environment Variables

Create a `.env` file in the frontend directory for environment-specific configuration:

```
REACT_APP_API_URL=http://localhost:3000
```

## Security Notes

- Authentication is handled via Google OAuth
- No password storage or management required
- Google accounts are pre-verified
- Session management is handled server-side
- All API calls require valid authentication

## Troubleshooting

### Common Issues

1. **Google OAuth Error**: Ensure Google OAuth credentials are properly configured
2. **API Connection Error**: Make sure the backend server is running on port 3000
3. **CORS Issues**: The proxy configuration in package.json should handle this
4. **Session Issues**: Clear browser cookies if experiencing authentication problems

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify the backend API is accessible
3. Ensure Google OAuth credentials are properly configured
4. Check that all dependencies are installed correctly

## Cypress End-to-End Testing

This project uses [Cypress](https://www.cypress.io/) for end-to-end (E2E) testing.

### Prerequisites
- Node.js and npm installed
- Backend and frontend servers running locally

### Running Cypress Locally

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Start the backend and frontend:**
   - Backend: `dotnet run --project ../backend`
   - Frontend: `npm start`
3. **Run Cypress in interactive mode:**
   ```sh
   npx cypress open
   ```
   or run all tests headlessly:
   ```sh
   npm run cypress:run
   ```

### Test Files
- **Google OAuth Tests**: `1-google-login.cy.js`
- **Session Management**: `5-session-persistence.cy.js`
- **Language Preferences**: `6-language-preference.cy.js`
- **Error Handling**: `7-error-handling.cy.js`

### Test Strategy
- Google OAuth flow is mocked using Cypress intercepts
- Tests focus on authentication state management
- Session persistence and error handling are thoroughly tested

## Future Enhancements

- Additional OAuth providers (GitHub, Microsoft, etc.)
- Enhanced user profile management
- Advanced analytics features
- Mobile app development
- Enhanced security features
