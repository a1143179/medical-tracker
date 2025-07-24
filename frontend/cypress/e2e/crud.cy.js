
let currentUserId;

describe('Medical Tracker CRUD Flow', () => {

  beforeEach(() => {
    cy.session('testuser', () => {
      cy.request('/api/auth/testlogin').then((resp) => {
        const cookies = resp.headers['set-cookie'];
        if (cookies) {
          const jwtCookie = cookies.find(c => c.startsWith('MedicalTracker.Auth.JWT='));
          if (jwtCookie) {
            const jwtValue = jwtCookie.split(';')[0].split('=')[1];
            cy.setCookie('MedicalTracker.Auth.JWT', jwtValue, { path: '/' });
          }
        }
      });
    });
    cy.visit('/dashboard');
    cy.window().then(win => cy.log('document.cookie: ' + win.document.cookie));
    cy.contains(/Add New Record|添加新记录/, { timeout: 10000 }).should('be.visible');
  });

  it('should add, update, and delete a record', () => {
    // Add a new record
    cy.contains('Add New Record').click();
    cy.get('input[name="measurementTime"]').type('2024-07-21T10:00');
    cy.get('input[name="value"]').type('5.5');
    cy.get('textarea[name="notes"]').type('Test record');
    cy.get('[data-testid="add-new-record-button"]').click(); // Use data-testid for the add button
    cy.contains('Record added successfully').should('be.visible');

    // 如有分页控件，设置每页显示 25 条，避免新记录被分页隐藏
    cy.get('body').then($body => {
      if ($body.find('select[aria-label="Rows per page:"]').length) {
        cy.get('select[aria-label="Rows per page:"]').select('25');
      }
    });

    // 等待“Test record”行出现
    cy.contains('Test record', { timeout: 10000 }).should('be.visible');

    // Update the record
    cy.contains('Test record').parents('tr').within(() => {
      cy.get('[data-testid="edit-record-button"]').should('exist').click(); // Use data-testid for the edit button
    });
    cy.get('input[name="value"]').clear().type('6.2');
    cy.get('textarea[name="notes"]').clear().type('Updated record');
    cy.get('[data-testid="save-record-button"]').click(); // Use data-testid for the save button
    cy.contains('Record updated successfully').should('be.visible');
    cy.contains('Updated record').should('be.visible');

    // Delete the record
    cy.contains('Updated record').parents('tr').within(() => {
      // Set up window:confirm handler before clicking delete
      cy.on('window:confirm', (str) => {
        expect(str).to.eq('Are you sure you want to delete this record?');
        return true;
      });
      cy.get('[data-testid="delete-record-button"]').click(); // Use data-testid for the delete button
    });
    cy.contains('Record deleted successfully').should('be.visible');
    cy.contains('Updated record').should('not.exist');
  });
});