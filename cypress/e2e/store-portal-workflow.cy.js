describe('Store Portal Workflow', () => {
  beforeEach(() => {
    // Set up test data and login
    cy.loginAsStoreUser();
    cy.visit('/store-portal');
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it('should complete full store portal workflow: auto-login, view dashboard, update prices', () => {
    // Step 1: Verify auto-login and portal loads
    cy.get('[data-testid="store-portal"]').should('be.visible');
    cy.get('[data-testid="dashboard-tab"]').should('be.visible');
    cy.get('[data-testid="product-management-tab"]').should('be.visible');
    cy.get('[data-testid="price-intelligence-tab"]').should('be.visible');
    cy.get('[data-testid="customer-demand-tab"]').should('be.visible');

    // Verify user is logged in
    cy.get('[data-testid="user-info"]').should('contain', 'owner@koshercorner.com');

    // Step 2: View dashboard
    cy.get('[data-testid="dashboard-tab"]').click();
    cy.get('[data-testid="store-name"]').should('be.visible');
    cy.get('[data-testid="wins-tracker"]').should('be.visible');
    cy.get('[data-testid="price-intelligence-summary"]').should('be.visible');
    cy.get('[data-testid="demand-analytics-summary"]').should('be.visible');

    // Step 3: Navigate to product management
    cy.get('[data-testid="product-management-tab"]').click();
    cy.get('[data-testid="products-table"]').should('be.visible');

    // Step 4: Update product price
    cy.get('[data-testid="product-row"]').first().within(() => {
      cy.get('[data-testid="price-cell"]').dblclick();
      cy.get('[data-testid="price-input"]').clear().type('3.99');
      cy.get('[data-testid="save-price-button"]').click();
    });

    // Verify price update success
    cy.get('[data-testid="success-message"]').should('contain', 'Price updated successfully');
    cy.get('[data-testid="price-cell"]').should('contain', '3.99');

    // Step 5: Update stock status
    cy.get('[data-testid="product-row"]').first().within(() => {
      cy.get('[data-testid="stock-toggle"]').click();
    });

    // Verify stock status update
    cy.get('[data-testid="success-message"]').should('contain', 'Stock status updated');

    // Step 6: Verify data in database
    cy.verifyDatabaseState(
      "SELECT sp.price FROM store_products sp JOIN products p ON sp.product_id = p.id WHERE p.name = 'Milk'",
      [{ price: 3.99 }]
    );
  });

  it('should display and interact with price intelligence', () => {
    // Add test data for price intelligence
    cy.addTestPrice({
      store: 'B Kosher',
      productName: 'Milk',
      price: 2.5,
      unit: '2 pints'
    });

    cy.addTestPrice({
      store: 'Tapuach',
      productName: 'Milk',
      price: 2.75,
      unit: '2 pints'
    });

    // Navigate to price intelligence
    cy.get('[data-testid="price-intelligence-tab"]').click();
    cy.get('[data-testid="price-intelligence-table"]').should('be.visible');

    // Verify competitive analysis
    cy.get('[data-testid="product-row"]').should('contain', 'Milk');
    cy.get('[data-testid="my-price"]').should('contain', '2.5');
    cy.get('[data-testid="competitor-prices"]').should('contain', '2.75');

    // Check competitive advantage highlighting
    cy.get('[data-testid="competitive-advantage"]').should('be.visible');
    cy.get('[data-testid="competitive-disadvantage"]').should('be.visible');

    // Test price adjustment suggestions
    cy.get('[data-testid="price-suggestion"]').should('be.visible');
    cy.get('[data-testid="apply-suggestion-button"]').click();
    cy.get('[data-testid="success-message"]').should('contain', 'Price updated based on suggestion');
  });

  it('should display and analyze customer demand data', () => {
    // Navigate to customer demand
    cy.get('[data-testid="customer-demand-tab"]').click();
    cy.get('[data-testid="demand-analytics"]').should('be.visible');

    // Verify top searches
    cy.get('[data-testid="top-searches"]').should('be.visible');
    cy.get('[data-testid="search-item"]').should('have.length.greaterThan', 0);

    // Verify missed opportunities
    cy.get('[data-testid="missed-opportunities"]').should('be.visible');
    cy.get('[data-testid="opportunity-item"]').should('have.length.greaterThan', 0);

    // Verify peak times
    cy.get('[data-testid="peak-times"]').should('be.visible');
    cy.get('[data-testid="peak-time-item"]').should('have.length.greaterThan', 0);

    // Test adding missed opportunity to inventory
    cy.get('[data-testid="opportunity-item"]').first().within(() => {
      cy.get('[data-testid="add-to-inventory-button"]').click();
    });

    cy.get('[data-testid="add-product-modal"]').should('be.visible');
    cy.get('[data-testid="product-name-input"]').should('have.value', 'organic apples');
    cy.get('[data-testid="category-select"]').select('produce');
    cy.get('[data-testid="add-product-button"]').click();

    cy.get('[data-testid="success-message"]').should('contain', 'Product added to inventory');
  });

  it('should handle product management operations', () => {
    // Navigate to product management
    cy.get('[data-testid="product-management-tab"]').click();

    // Test product search
    cy.get('[data-testid="product-search"]').type('milk');
    cy.get('[data-testid="search-button"]').click();

    // Verify search results
    cy.get('[data-testid="product-row"]').should('contain', 'milk');

    // Test bulk price update
    cy.get('[data-testid="select-all-checkbox"]').check();
    cy.get('[data-testid="bulk-action-select"]').select('update-price');
    cy.get('[data-testid="bulk-price-input"]').type('2.99');
    cy.get('[data-testid="bulk-update-button"]').click();

    // Verify bulk update success
    cy.get('[data-testid="success-message"]').should('contain', 'Bulk price update completed');

    // Test product filtering
    cy.get('[data-testid="category-filter"]').select('dairy');
    cy.get('[data-testid="filter-button"]').click();

    // Verify filtered results
    cy.get('[data-testid="product-row"]').each(($row) => {
      cy.wrap($row).should('contain', 'dairy');
    });

    // Test stock status bulk update
    cy.get('[data-testid="select-all-checkbox"]').check();
    cy.get('[data-testid="bulk-action-select"]').select('update-stock');
    cy.get('[data-testid="bulk-stock-select"]').select('out-of-stock');
    cy.get('[data-testid="bulk-update-button"]').click();

    // Verify stock status update
    cy.get('[data-testid="success-message"]').should('contain', 'Bulk stock update completed');
  });

  it('should handle dashboard analytics and insights', () => {
    // Navigate to dashboard
    cy.get('[data-testid="dashboard-tab"]').click();

    // Verify dashboard components
    cy.get('[data-testid="store-name"]').should('be.visible');
    cy.get('[data-testid="wins-tracker"]').should('be.visible');
    cy.get('[data-testid="price-intelligence-summary"]').should('be.visible');
    cy.get('[data-testid="demand-analytics-summary"]').should('be.visible');

    // Test wins tracker
    cy.get('[data-testid="new-customers-count"]').should('be.visible');
    cy.get('[data-testid="wins-reason"]').should('be.visible');
    cy.get('[data-testid="wins-period"]').should('be.visible');

    // Test price intelligence summary
    cy.get('[data-testid="cheapest-items-count"]').should('be.visible');
    cy.get('[data-testid="most-expensive-items-count"]').should('be.visible');

    // Test demand analytics summary
    cy.get('[data-testid="top-searches-list"]').should('be.visible');
    cy.get('[data-testid="missed-opportunities-list"]').should('be.visible');

    // Test refresh functionality
    cy.get('[data-testid="refresh-dashboard-button"]').click();
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });

  it('should handle error scenarios gracefully', () => {
    // Test invalid price update
    cy.get('[data-testid="product-management-tab"]').click();
    cy.get('[data-testid="product-row"]').first().within(() => {
      cy.get('[data-testid="price-cell"]').dblclick();
      cy.get('[data-testid="price-input"]').clear().type('invalid-price');
      cy.get('[data-testid="save-price-button"]').click();
    });

    // Verify validation error
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid price format');

    // Test network error handling
    cy.intercept('PUT', '/api/store-portal/products/*/price', { forceNetworkError: true }).as('networkError');
    
    cy.get('[data-testid="product-row"]').first().within(() => {
      cy.get('[data-testid="price-cell"]').dblclick();
      cy.get('[data-testid="price-input"]').clear().type('3.99');
      cy.get('[data-testid="save-price-button"]').click();
    });

    // Verify network error handling
    cy.get('[data-testid="error-message"]').should('contain', 'Network error');

    // Test unauthorized access
    cy.clearLocalStorage();
    cy.visit('/store-portal');
    cy.get('[data-testid="login-required"]').should('be.visible');
  });

  it('should handle responsive design', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('[data-testid="store-portal"]').should('be.visible');
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="mobile-menu"]').should('be.visible');

    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('[data-testid="store-portal"]').should('be.visible');
    cy.get('[data-testid="tablet-layout"]').should('be.visible');

    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('[data-testid="store-portal"]').should('be.visible');
    cy.get('[data-testid="desktop-layout"]').should('be.visible');
  });
});
