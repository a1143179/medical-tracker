describe('Medical Tracker Smoke Tests', () => {
  beforeEach(() => {
    // Mock Google OAuth
    cy.intercept('GET', 'https://accounts.google.com/o/oauth2/auth*', {
      statusCode: 200,
      body: { access_token: 'mock_token' }
    }).as('googleAuth');

    // Mock Google OAuth callback
    cy.intercept('POST', 'https://oauth2.googleapis.com/token', {
      statusCode: 200,
      body: {
        access_token: 'mock_access_token',
        id_token: 'mock_id_token'
      }
    }).as('googleToken');

    // Mock Google user info
    cy.intercept('GET', 'https://www.googleapis.com/oauth2/v2/userinfo', {
      statusCode: 200,
      body: {
        id: '12345',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      }
    }).as('googleUserInfo');

    // Mock backend API calls
    cy.intercept('GET', '/api/health', {
      statusCode: 200,
      body: { status: 'healthy' }
    }).as('healthCheck');

    cy.intercept('GET', '/api/records*', {
      statusCode: 200,
      body: []
    }).as('getRecords');

    cy.intercept('GET', '/api/value-types', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Blood Sugar', nameZh: '血糖', unit: 'mmol/L', requiresTwoValues: false },
        { id: 2, name: 'Blood Pressure', nameZh: '血压', unit: 'mmHg', requiresTwoValues: true }
      ]
    }).as('getValueTypes');

    cy.intercept('POST', '/api/records', {
      statusCode: 201,
      body: { id: 1, message: 'Record created successfully' }
    }).as('createRecord');

    cy.intercept('PUT', '/api/records/*', {
      statusCode: 200,
      body: { message: 'Record updated successfully' }
    }).as('updateRecord');

    cy.intercept('DELETE', '/api/records/*', {
      statusCode: 200,
      body: { message: 'Record deleted successfully' }
    }).as('deleteRecord');
  });

  it('should load the application and show login page', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
    cy.get('[data-testid="google-login-button"]').should('be.visible');
    cy.get('img[src*="logo.png"]').should('be.visible');
  });

  it('should handle Google login flow', () => {
    cy.visit('/login');
    
    // Mock successful login
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 1
      }));
    });

    cy.get('[data-testid="google-login-button"]').click();
    cy.wait('@googleAuth');
    cy.wait('@googleToken');
    cy.wait('@googleUserInfo');
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should display dashboard with empty state', () => {
    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 1
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getRecords');
    cy.wait('@getValueTypes');

    // Check dashboard elements
    cy.get('[data-testid="dashboard-header"]').should('be.visible');
    cy.get('[data-testid="value-type-selector"]').should('be.visible');
    cy.get('[data-testid="latest-reading-card"]').should('contain', 'No Data');
    cy.get('[data-testid="total-records-card"]').should('contain', '0');
  });

  it('should add a new blood sugar record', () => {
    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 1
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getRecords');
    cy.wait('@getValueTypes');

    // Click add record button
    cy.get('[data-testid="add-record-button"]').click();
    
    // Fill form
    cy.get('[data-testid="measurement-time-input"]').type('2024-01-15T10:30');
    cy.get('[data-testid="value-input"]').type('5.5');
    cy.get('[data-testid="notes-input"]').type('Test record');
    
    // Submit form
    cy.get('[data-testid="submit-record-button"]').click();
    cy.wait('@createRecord');
    
    // Should show success message
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should add a new blood pressure record', () => {
    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 2
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getRecords');
    cy.wait('@getValueTypes');

    // Select blood pressure type
    cy.get('[data-testid="value-type-selector"]').click();
    cy.get('[data-testid="value-type-option-2"]').click();

    // Click add record button
    cy.get('[data-testid="add-record-button"]').click();
    
    // Fill form with both systolic and diastolic
    cy.get('[data-testid="measurement-time-input"]').type('2024-01-15T10:30');
    cy.get('[data-testid="systolic-input"]').type('120');
    cy.get('[data-testid="diastolic-input"]').type('80');
    cy.get('[data-testid="notes-input"]').type('Test BP record');
    
    // Submit form
    cy.get('[data-testid="submit-record-button"]').click();
    cy.wait('@createRecord');
    
    // Should show success message
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should display records table with data', () => {
    // Mock records data
    cy.intercept('GET', '/api/records*', {
      statusCode: 200,
      body: [
        {
          id: 1,
          measurementTime: '2024-01-15T10:30:00',
          value: 5.5,
          value2: null,
          notes: 'Test record',
          valueTypeId: 1
        }
      ]
    }).as('getRecordsWithData');

    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 1
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getRecordsWithData');
    cy.wait('@getValueTypes');

    // Check records table
    cy.get('[data-testid="records-table"]').should('be.visible');
    cy.get('[data-testid="record-row-1"]').should('contain', '5.5');
    cy.get('[data-testid="record-row-1"]').should('contain', 'Test record');
  });

  it('should handle language switching', () => {
    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 1
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getRecords');
    cy.wait('@getValueTypes');

    // Switch to Chinese
    cy.get('[data-testid="language-switch"]').click();
    cy.get('[data-testid="language-option-zh"]').click();
    
    // Check if text changed to Chinese
    cy.get('[data-testid="latest-reading-card"]').should('contain', '最新读数');
  });

  it('should handle error states', () => {
    // Mock API error
    cy.intercept('GET', '/api/records*', {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }).as('getRecordsError');

    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 1
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getRecordsError');

    // Should show error message
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should handle mobile responsive design', () => {
    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 1
      }));
    });

    // Set mobile viewport
    cy.viewport('iphone-x');
    cy.visit('/dashboard');
    cy.wait('@getRecords');
    cy.wait('@getValueTypes');

    // Check mobile navigation
    cy.get('[data-testid="mobile-nav"]').should('be.visible');
    cy.get('[data-testid="mobile-dashboard-tab"]').should('be.visible');
    cy.get('[data-testid="mobile-analytics-tab"]').should('be.visible');
    cy.get('[data-testid="mobile-add-tab"]').should('be.visible');
  });

  it('should validate form inputs', () => {
    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 1
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getRecords');
    cy.wait('@getValueTypes');

    // Click add record button
    cy.get('[data-testid="add-record-button"]').click();
    
    // Try to submit empty form
    cy.get('[data-testid="submit-record-button"]').click();
    
    // Should show validation errors
    cy.get('[data-testid="validation-error"]').should('be.visible');
    
    // Try invalid value
    cy.get('[data-testid="value-input"]').type('-1');
    cy.get('[data-testid="submit-record-button"]').click();
    cy.get('[data-testid="validation-error"]').should('be.visible');
  });

  it('should handle logout', () => {
    // Mock authenticated user
    cy.window().then((win) => {
      win.localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        preferredValueTypeId: 1
      }));
    });

    cy.visit('/dashboard');
    cy.wait('@getRecords');
    cy.wait('@getValueTypes');

    // Click logout
    cy.get('[data-testid="logout-button"]').click();
    
    // Should redirect to login page
    cy.url().should('include', '/login');
    cy.get('[data-testid="google-login-button"]').should('be.visible');
  });
}); 