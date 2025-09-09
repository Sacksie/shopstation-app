// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/admin/login`,
    body: {
      password: Cypress.env('ADMIN_PASSWORD')
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem('adminToken', response.body.token);
  });
});

// Custom command to login as store user
Cypress.Commands.add('loginAsStoreUser', (email = 'owner@koshercorner.com', password = 'password123') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/store-portal/login`,
    body: {
      email,
      password
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem('storeToken', response.body.token);
  });
});

// Custom command to create test data
Cypress.Commands.add('createTestProduct', (productData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/manual/add-product`,
    headers: {
      'x-admin-password': Cypress.env('ADMIN_PASSWORD'),
      'Content-Type': 'application/json'
    },
    body: productData
  });
});

// Custom command to add test price
Cypress.Commands.add('addTestPrice', (priceData) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/manual/add-price`,
    headers: {
      'x-admin-password': Cypress.env('ADMIN_PASSWORD'),
      'Content-Type': 'application/json'
    },
    body: priceData
  });
});

// Custom command to clean up test data
Cypress.Commands.add('cleanupTestData', () => {
  // This would typically involve deleting test data
  // Implementation depends on your cleanup strategy
  cy.log('Cleaning up test data...');
});

// Custom command to wait for API response
Cypress.Commands.add('waitForApiResponse', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201]);
  });
});

// Custom command to check for loading states
Cypress.Commands.add('checkLoadingState', (loadingText = 'Loading') => {
  cy.contains(loadingText).should('be.visible');
  cy.contains(loadingText).should('not.exist');
});

// Custom command to fill form fields
Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="${field}"]`).clear().type(value);
  });
});

// Custom command to verify database state
Cypress.Commands.add('verifyDatabaseState', (query, expectedResult) => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('API_URL')}/api/admin/verify-data`,
    headers: {
      'x-admin-password': Cypress.env('ADMIN_PASSWORD')
    },
    qs: { query }
  }).then((response) => {
    expect(response.body).to.deep.equal(expectedResult);
  });
});
