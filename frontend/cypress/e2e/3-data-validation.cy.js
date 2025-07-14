/* eslint-env cypress */
/* global cy */

describe('Data Validation', () => {
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
    cy.get('[data-testid="add-new-record-tab"]').click();
    cy.get('[data-testid="add-new-record-button"]').should('be.visible');
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

  it('should validate blood sugar level range', () => {
    cy.get('[data-testid="add-new-record-tab"]').click();
    cy.get('[data-testid="add-new-record-button"]').click();
    // Test below minimum value
    cy.get('input[name="level"]').type('0.05');
    cy.get('textarea[name="notes"]').type('Test below minimum');
    cy.get('form').submit();
    cy.get('[data-testid="error-message"]').should('be.visible');
    // Test minimum value (should be valid)
    cy.get('input[name="level"]').clear().type('0.1');
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
    // Test above maximum value (should fail)
    cy.get('[data-testid="add-new-record-tab"]').click();
    cy.get('[data-testid="add-new-record-button"]').click();
    cy.get('input[name="level"]').type('1001');
    cy.get('textarea[name="notes"]').type('Test above maximum');
    cy.get('form').submit();
    cy.get('[data-testid="error-message"]').should('be.visible');
    // Test maximum value (should be valid)
    cy.get('input[name="level"]').clear().type('1000');
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
    // Test valid value in middle range
    cy.get('[data-testid="add-new-record-tab"]').click();
    cy.get('[data-testid="add-new-record-button"]').click();
    cy.get('input[name="level"]').type('75');
    cy.get('textarea[name="notes"]').type('Test middle range');
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should validate blood sugar level format', () => {
    cy.get('[data-testid="add-new-record-button"]').click();
    // Test non-numeric input
    cy.get('input[name="level"]').type('abc');
    cy.get('textarea[name="notes"]').type('Test invalid format');
    cy.get('form').submit();
    cy.get('[data-testid="error-message"]').should('be.visible');
    // Test decimal values
    cy.get('input[name="level"]').clear().type('85.5');
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should validate notes length', () => {
    cy.get('[data-testid="add-new-record-tab"]').click();
    cy.get('[data-testid="add-new-record-button"]').click();
    // For both the 1000 and 1001 character notes tests, set the blood sugar level to a valid value (e.g., 85) before submitting
    cy.get('input[name="level"]').clear().type('85');
    // Test maximum allowed length (1000 chars) - should pass
    const baseNotes = 'a'.repeat(999);
    cy.get('textarea[name="notes"]').clear().invoke('val', baseNotes).trigger('input');
    cy.get('textarea[name="notes"]').type('a'); // Add 1000th character
    cy.get('textarea[name="notes"]').should('have.value', baseNotes + 'a');
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
    // Test over limit (1001 chars) - should fail
    cy.get('[data-testid="add-new-record-tab"]').click();
    cy.get('[data-testid="add-new-record-button"]').click();
    // For both the 1000 and 1001 character notes tests, set the blood sugar level to a valid value (e.g., 85) before submitting
    cy.get('input[name="level"]').clear().type('85');
    const baseNotes2 = 'a'.repeat(1000);
    cy.get('textarea[name="notes"]').clear().invoke('val', baseNotes2).trigger('input');
    cy.get('textarea[name="notes"]').type('a'); // Add 1001st character
    cy.get('textarea[name="notes"]').should('have.value', baseNotes2 + 'a');
    cy.get('form').submit();
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').find('button').click(); // Close error message
    cy.contains('button', 'Cancel').click(); // Close the add new record dialog
    cy.get('[data-testid="add-new-record-tab"]').click();
    // Test realistic medical notes
    cy.get('[data-testid="add-new-record-button"]').click();
    // For the realistic notes test, set the blood sugar level to a valid value before submitting
    cy.get('input[name="level"]').clear().type('85');
    const realisticNotes = 'Blood sugar reading taken after breakfast. Feeling slightly dizzy. Will monitor closely.';
    cy.get('textarea[name="notes"]').clear().type(realisticNotes);
    cy.get('textarea[name="notes"]').should('have.value', realisticNotes);
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should handle empty required fields', () => {
    cy.get('[data-testid="add-new-record-button"]').click();
    // Submit without level
    cy.get('textarea[name="notes"]').type('Test empty level');
    cy.get('form').submit();
    cy.get('[data-testid="error-message"]').should('be.visible');
    // Submit with only level
    cy.get('input[name="level"]').type('85');
    cy.get('textarea[name="notes"]').clear();
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should handle special characters in notes', () => {
    const uniqueNote = `Test with special chars: !@#$%^&*() ${Date.now()}`;
    cy.get('[data-testid="add-new-record-button"]').click();
    cy.get('input[name="level"]').type('85');
    // Test special characters
    cy.get('textarea[name="notes"]').type(uniqueNote);
    cy.get('form').submit();
    cy.get('[data-testid="success-message"]').should('be.visible');
    // Verify that a record was created with the unique note
    cy.get('[data-testid="blood-sugar-records"]').should('contain', uniqueNote);
  });
}); 