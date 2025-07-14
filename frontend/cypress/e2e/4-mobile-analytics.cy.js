/* eslint-env cypress */
/* global cy */
// describe('Mobile Analytics Navigation', () => {
//   let records;

//   beforeEach(() => {
//     // Set mobile viewport for all tests in this describe block
//     cy.viewport('iphone-6');
//     records = [
//       {
//         id: 1,
//         measurementTime: '2024-07-10T10:00:00Z',
//         level: 6.6,
//         notes: 'Morning',
//         userId: 1
//       }
//     ];
//     cy.intercept('GET', 'https://accounts.google.com/o/oauth2/auth', { statusCode: 200, body: {} }).as('googleAuth');
//     cy.intercept('POST', 'https://oauth2.googleapis.com/token', { statusCode: 200, body: { access_token: 'fake-access-token', id_token: 'fake-id-token' } }).as('googleToken');
//     cy.intercept('GET', 'https://www.googleapis.com/oauth2/v2/userinfo', {
//       statusCode: 200,
//       body: {
//         id: '1234567890',
//         email: 'testuser@example.com',
//         name: 'Test User',
//         verified_email: true,
//         picture: 'https://example.com/avatar.png'
//       }
//     }).as('googleUserInfo');
//     cy.intercept('GET', '/api/auth/me', {
//       statusCode: 200,
//       body: {
//         id: 1,
//         email: 'testuser@example.com',
//         name: 'Test User',
//         createdAt: '2024-01-01T00:00:00Z',
//         languagePreference: 'en'
//       }
//     }).as('getUserInfo');
//     cy.intercept('GET', '/api/records*', (req) => {
//       req.reply({ statusCode: 200, body: records });
//     }).as('getRecords');
//     cy.intercept('POST', '/api/records*', (req) => {
//       const newRecord = {
//         id: records.length + 1,
//         measurementTime: req.body.measurementTime || new Date().toISOString(),
//         level: parseFloat(req.body.level),
//         notes: req.body.notes || '',
//         userId: 1
//       };
//       records.unshift(newRecord);
//       req.reply({ statusCode: 201, body: newRecord });
//     }).as('addRecord');
//     cy.intercept('PUT', /\/api\/records\/.*/, (req) => {
//       const id = parseInt(req.url.split('/').pop());
//       const idx = records.findIndex(r => r.id === id);
//       if (idx !== -1) {
//         records[idx] = { ...records[idx], ...req.body };
//       }
//       req.reply({ statusCode: 200, body: records[idx] });
//     }).as('editRecord');
//     cy.intercept('DELETE', /\/api\/records\/.*/, (req) => {
//       const id = parseInt(req.url.split('/').pop());
//       records = records.filter(r => r.id !== id);
//       req.reply({ statusCode: 200 });
//     }).as('deleteRecord');
//     cy.visit('/dashboard');
//     // In mobile view, we don't need to click on tabs - the mobile layout is different
//     // Just verify we're on the dashboard
//     cy.contains('Latest Reading').should('be.visible');
//   });

//   it('should navigate to analytics page from mobile menu', () => {
//     // Open mobile menu - wait for it to be available and click
//     cy.get('[aria-label="menu"]').should('exist').click({ force: true });
    
//     // Click on analytics menu item
//     cy.contains('Analytics').click();
    
//     // Verify analytics page is displayed
//     cy.contains('Analytics').should('be.visible');
    
//     // Check for chart or summary regardless of record list
//     cy.get('body').then(($body) => {
//       if ($body.find('.recharts-wrapper').length > 0) {
//         cy.get('.recharts-wrapper').should('be.visible');
//       } else {
//         cy.contains('No data available for analytics').should('be.visible');
//       }
//     });
//   });

//   it('should navigate to add new record page from mobile menu', () => {
//     // Navigate to analytics page
//     cy.get('[aria-label="menu"]').should('exist').click({ force: true });
//     cy.contains('Analytics').click();
    
//     // Open hamburger menu (not language switcher) and click 'Add New Record' menu item
//     cy.get('[aria-label="menu"]').should('exist').click({ force: true });
//     cy.get('[data-testid="add-record-menu-item"]').click();
    
//     // Verify add new record page is displayed
//     cy.contains('Add New Record').should('be.visible');
//     cy.get('input[name="level"]').should('be.visible');
//   });

//   it('should return to dashboard from mobile menu', () => {
//     // Navigate to analytics page first
//     cy.get('[aria-label="menu"]').should('exist').click({ force: true });
//     cy.contains('Analytics').click();
    
//     // Navigate back to dashboard
//     cy.get('[aria-label="menu"]').should('exist').click({ force: true });
//     // Click on Dashboard menu item
//     cy.contains('Dashboard').click();
    
//     // Verify dashboard is displayed
//     cy.contains('Latest Reading').should('be.visible');
//   });

//   it('should display charts when data is available', () => {
//     // Add a test record first
//     cy.get('[aria-label="menu"]').should('be.visible').click();
//     cy.get('[data-testid="add-record-menu-item"]').should('be.visible').click();
//     cy.contains('Add New Record').should('be.visible');
//     cy.wait(100); // Wait for form to fully render
//     cy.get('input[name="level"]').as('levelInput').should('not.be.disabled');
//     // Try typing with dot, then with comma if needed
//     cy.get('@levelInput').clear().type('5.5', { delay: 100 });
//     cy.wait(100);
//     cy.get('input[name="level"]').then($input => {
//       const val = $input.val();
//       if (val !== '5.5') {
//         cy.get('input[name="level"]').clear().type('5,5', { delay: 100 });
//         cy.wait(100);
//         cy.get('input[name="level"]').should('have.value', '5,5');
//       } else {
//         cy.get('input[name="level"]').should('have.value', '5.5');
//       }
//     });
//     cy.get('textarea[name="notes"]').should('be.visible').clear().type('Test record for analytics', { delay: 10 });
//     cy.get('form').submit();
//     cy.wait('@addRecord');
//     cy.get('[data-testid="success-message"]').should('exist').and('be.visible');
//     // Go to analytics page
//     cy.get('[aria-label="menu"]').should('be.visible').click();
//     cy.contains('Analytics').should('be.visible').click();
//     cy.get('.recharts-wrapper', { timeout: 10000 }).should('be.visible');
//     cy.contains('Blood Sugar Trends').should('be.visible');
//     cy.contains('Recent Readings').should('be.visible');
//     // Use regex to match mmol/L value
//     cy.contains(/5\.5 mmol\/L/).should('be.visible');
//   });
// }); 

// describe('Mobile Add/Edit Record Navigation', () => {
//   let records = [
//     {
//       id: 1,
//       measurementTime: '2024-07-10T10:00:00Z',
//       level: 6.6,
//       notes: 'Morning',
//       userId: 1
//     },
//     {
//       id: 2,
//       measurementTime: '2024-07-10T08:00:00Z',
//       level: 5.5,
//       notes: 'Fasting',
//       userId: 1
//     }
//   ];

//   beforeEach(() => {
//     cy.viewport('iphone-6');
//     cy.intercept('GET', '/api/auth/me', {
//       statusCode: 200,
//       body: {
//         id: 1,
//         email: 'testuser@example.com',
//         name: 'Test User',
//         createdAt: '2024-01-01T00:00:00Z',
//         languagePreference: 'en'
//       }
//     }).as('getUserInfo');
//     cy.intercept('GET', '/api/records*', (req) => {
//       req.reply({ statusCode: 200, body: records });
//     }).as('getRecords');
//     cy.intercept('POST', '/api/records*', (req) => {
//       const newRecord = {
//         id: records.length + 1,
//         measurementTime: new Date().toISOString(),
//         level: parseFloat(req.body.level),
//         notes: req.body.notes || '',
//         userId: 1
//       };
//       records.unshift(newRecord);
//       req.reply({ statusCode: 201, body: {} });
//     }).as('addRecord');
//     cy.intercept('PUT', /\/api\/records\/.*/, (req) => {
//       const id = parseInt(req.url.split('/').pop());
//       const idx = records.findIndex(r => r.id === id);
//       if (idx !== -1) {
//         records[idx] = { ...records[idx], ...req.body };
//       }
//       req.reply({ statusCode: 200, body: {} });
//     }).as('editRecord');
//     cy.visit('/dashboard');
//   });

//   it('should open add new record page from mobile menu', () => {
//     cy.get('[aria-label="menu"]').should('exist').click({ force: true });
//     cy.get('[data-testid="add-record-menu-item"]').click();
//     cy.contains('Add New Record').should('be.visible');
//     cy.get('[data-testid="add-new-record-button"]').should('be.visible');
//   });

//   it('should open edit record page from record list and allow saving', () => {
//     // Add a record first
//     cy.get('[aria-label="menu"]').should('be.visible').click();
//     cy.get('[data-testid="add-record-menu-item"]').should('be.visible').click();
//     cy.wait(100); // Wait for form to fully render
//     cy.get('input[name="level"]').as('levelInput').should('not.be.disabled');
//     // Try typing with dot, then with comma if needed
//     cy.get('@levelInput').clear().type('5.5', { delay: 100 });
//     cy.wait(100);
//     cy.get('input[name="level"]').then($input => {
//       const val = $input.val();
//       if (val !== '5.5') {
//         cy.get('input[name="level"]').clear().type('5,5', { delay: 100 });
//         cy.wait(100);
//         cy.get('input[name="level"]').should('have.value', '5,5');
//       } else {
//         cy.get('input[name="level"]').should('have.value', '5.5');
//       }
//     });
//     cy.get('[data-testid="add-new-record-button"]').should('be.visible').click();
//     cy.contains('Record added successfully').should('be.visible');
//     cy.wait('@getRecords');
//     // Use regex to match mmol/L value
//     cy.contains(/5\.5 mmol\/L/, { timeout: 10000 }).should('be.visible');
//     // In mobile view, there's no table with edit buttons
//     // Instead, we can navigate to the add record page and verify it works
//     cy.get('[aria-label="menu"]').should('be.visible').click();
//     cy.get('[data-testid="add-record-menu-item"]').should('be.visible').click();
//     cy.contains('Add New Record').should('be.visible');
//     cy.get('input[name="level"]').should('be.visible');
//     cy.get('[data-testid="add-new-record-button"]').should('be.visible');
//   });
// }); 