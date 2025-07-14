/* eslint-env cypress */
/* global cy */

describe('Dashboard CRUD', () => {
  let records = [];

  beforeEach(() => {
    // Mock Google OAuth endpoints only
    cy.intercept('GET', 'https://accounts.google.com/o/oauth2/auth', { statusCode: 200, body: {} }).as('googleAuth');
    cy.intercept('POST', 'https://oauth2.googleapis.com/token', { statusCode: 200, body: { access_token: 'fake-access-token', id_token: 'fake-id-token' } }).as('googleToken');
    cy.intercept('GET', 'https://www.googleapis.com/oauth2/v2/userinfo', {
      statusCode: 200,
      body: {
        id: '1234567890',
        email: 'testuser@example.com',
        name: 'Test User',
        verified_email: true,
        picture: 'https://example.com/avatar.png'
      }
    }).as('googleUserInfo');
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 200,
      body: {
        id: 1,
        email: 'testuser@example.com',
        name: 'Test User',
        createdAt: '2024-01-01T00:00:00Z',
        languagePreference: 'en'
      }
    }).as('getUserInfo');
    // Use a local array for records
    records = [
      {
        id: 1,
        measurementTime: '2024-07-10T10:00:00Z',
        level: 6.6,
        notes: 'Morning',
        userId: 1
      }
    ];
    cy.intercept('GET', '/api/records*', (req) => {
      req.reply({ statusCode: 200, body: records });
    }).as('getRecords');
    cy.intercept('POST', '/api/records*', (req) => {
      const newRecord = {
        id: records.length + 1,
        measurementTime: req.body.measurementTime || new Date().toISOString(),
        level: req.body.level,
        notes: req.body.notes || '',
        userId: 1
      };
      records.unshift(newRecord);
      req.reply({ statusCode: 201, body: newRecord });
    }).as('addRecord');
    cy.intercept('PUT', /\/api\/records\/.*/, (req) => {
      const id = parseInt(req.url.split('/').pop());
      const idx = records.findIndex(r => r.id === id);
      if (idx !== -1) {
        records[idx] = { ...records[idx], ...req.body };
      }
      req.reply({ statusCode: 200, body: records[idx] });
    }).as('editRecord');
    cy.intercept('DELETE', /\/api\/records\/.*/, (req) => {
      const id = parseInt(req.url.split('/').pop());
      records = records.filter(r => r.id !== id);
      req.reply({ statusCode: 200 });
    }).as('deleteRecord');
    cy.visit('/dashboard');
    // Start on the Records tab (tab 0) by default
    // The Records tab is the first tab, so we don't need to click anything
  });

  it('should display dashboard and records table', () => {
    cy.get('[data-testid="blood-sugar-records"]').should('be.visible');
    cy.get('[data-testid="blood-sugar-records"] tr').should('have.length.greaterThan', 0);
  });

  it('should pre-populate measure time within 5 seconds of now', () => {
    const now = new Date();
    now.setSeconds(0, 0); // Round to nearest minute to match input
    cy.clock(now);
    cy.visit('/');
    cy.get('[data-testid="add-new-record-tab"]').click();
    cy.get('[data-testid="add-new-record-button"]').should('be.visible');
    cy.get('input[name="measurementTime"]').invoke('val').then(val => {
      const inputDate = new Date(val);
      const diff = Math.abs(inputDate.getTime() - now.getTime());
      expect(diff).to.be.lessThan(5000);
    });
  });

  it('should add a new blood sugar record', () => {
    const uniqueNote = `Test record ${Date.now()}`;
    cy.contains('button, [role="tab"]', 'Add New Record').click();
    cy.get('[data-testid="add-new-record-button"]').click();
    cy.get('input[name="level"]').type('85');
    cy.get('textarea[name="notes"]').type(uniqueNote);
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="blood-sugar-records"]').should('contain', uniqueNote);
  });

  it('should edit a blood sugar record', () => {
    const uniqueNote = `Edited record ${Date.now()}`;
    cy.get('[data-testid="blood-sugar-records"] tr').first().within(() => {
      cy.get('button[title="edit"]').click();
    });
    cy.get('input[name="level"]').clear().type('95');
    cy.get('textarea[name="notes"]').clear().type(uniqueNote);
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="blood-sugar-records"]').should('contain', uniqueNote);
  });

  it('should delete a blood sugar record', () => {
    cy.get('[data-testid="blood-sugar-records"] tr').first().within(() => {
      cy.get('button[title="delete"]').click();
    });
    cy.on('window:confirm', () => true);
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="blood-sugar-records"] tr').should('have.length', 0);
  });

  it('should create multiple records successfully', () => {
    const uniqueNote1 = `First record ${Date.now()}`;
    const uniqueNote2 = `Second record ${Date.now() + 1}`;
    // Add first record
    cy.contains('button, [role="tab"]', 'Add New Record').click();
    cy.get('[data-testid="add-new-record-button"]').click();
    cy.get('input[name="level"]').type('70');
    cy.get('textarea[name="notes"]').type(uniqueNote1);
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
    // Add second record
    cy.contains('button, [role="tab"]', 'Add New Record').click();
    cy.get('[data-testid="add-new-record-button"]').click();
    cy.get('input[name="level"]').type('80');
    cy.get('textarea[name="notes"]').type(uniqueNote2);
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="blood-sugar-records"] tr').should('have.length.greaterThan', 1);
    cy.get('[data-testid="blood-sugar-records"]').should('contain', uniqueNote1);
    cy.get('[data-testid="blood-sugar-records"]').should('contain', uniqueNote2);
  });

  it('should add a record with next year date and verify it appears on first row', () => {
    const uniqueNote = `Next year record ${Date.now()}`;
    const nextYear = new Date().getFullYear() + 1;
    const nextYearDate = `${nextYear}-01-01T12:00`;
    
    cy.contains('button, [role="tab"]', 'Add New Record').click();
    cy.get('[data-testid="add-new-record-button"]').click();
    cy.get('input[name="level"]').type('60');
    cy.get('textarea[name="notes"]').type(uniqueNote);
    cy.get('input[name="measurementTime"]').clear().type(nextYearDate);
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
    
    // Verify the record appears on the first row (since it's the most recent date)
    cy.get('[data-testid="blood-sugar-records"] tr').first().should('contain', uniqueNote);
    cy.get('[data-testid="blood-sugar-records"] tr').first().should('contain', `${nextYear}-01-01 12:00:00`);
    
    // Delete the record to clean up
    cy.get('[data-testid="blood-sugar-records"] tr').first().within(() => {
      cy.get('button[title="delete"]').click();
    });
    cy.on('window:confirm', () => true);
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="blood-sugar-records"] tr').first().should('not.contain', uniqueNote);
  });
}); 