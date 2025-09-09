describe('Public User Workflow', () => {
  beforeEach(() => {
    // Set up test data
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

    cy.addTestPrice({
      store: 'Kosher Kingdom',
      productName: 'Milk',
      price: 2.4,
      unit: '2 pints'
    });

    cy.visit('/');
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it('should complete full public user workflow: search, compare, submit request', () => {
    // Step 1: Verify homepage loads
    cy.get('[data-testid="homepage"]').should('be.visible');
    cy.get('[data-testid="search-input"]').should('be.visible');
    cy.get('[data-testid="search-button"]').should('be.visible');

    // Step 2: Search for a product
    cy.get('[data-testid="search-input"]').type('milk');
    cy.get('[data-testid="search-button"]').click();

    // Verify search results
    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="product-card"]').should('contain', 'Milk');
    cy.get('[data-testid="store-price"]').should('have.length.greaterThan', 0);

    // Step 3: View detailed comparison
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="product-details"]').should('be.visible');
    cy.get('[data-testid="price-comparison-table"]').should('be.visible');

    // Verify price comparison data
    cy.get('[data-testid="price-row"]').should('contain', 'B Kosher');
    cy.get('[data-testid="price-row"]').should('contain', 'Tapuach');
    cy.get('[data-testid="price-row"]').should('contain', 'Kosher Kingdom');
    cy.get('[data-testid="price-row"]').should('contain', '2.5');
    cy.get('[data-testid="price-row"]').should('contain', '2.75');
    cy.get('[data-testid="price-row"]').should('contain', '2.4');

    // Verify cheapest price highlighting
    cy.get('[data-testid="cheapest-price"]').should('contain', '2.4');
    cy.get('[data-testid="cheapest-price"]').should('have.class', 'text-green-600');

    // Step 4: Submit product request
    cy.get('[data-testid="request-product-button"]').click();
    cy.get('[data-testid="product-request-modal"]').should('be.visible');

    // Fill out product request form
    cy.get('[data-testid="product-name-input"]').type('Organic Apples');
    cy.get('[data-testid="user-name-input"]').type('John Doe');
    cy.get('[data-testid="user-email-input"]').type('john@example.com');
    cy.get('[data-testid="category-suggestion-select"]').select('produce');
    cy.get('[data-testid="description-textarea"]').type('Looking for organic red apples');
    cy.get('[data-testid="submit-request-button"]').click();

    // Verify request submission
    cy.get('[data-testid="success-message"]').should('contain', 'Product request submitted successfully');
    cy.get('[data-testid="product-request-modal"]').should('not.exist');

    // Step 5: Verify request in database
    cy.verifyDatabaseState(
      "SELECT * FROM product_requests WHERE product_name = 'Organic Apples'",
      [{ product_name: 'Organic Apples', user_email: 'john@example.com' }]
    );
  });

  it('should handle product search with autocomplete', () => {
    // Test autocomplete functionality
    cy.get('[data-testid="search-input"]').type('mil');
    cy.get('[data-testid="autocomplete-suggestions"]').should('be.visible');
    cy.get('[data-testid="suggestion-item"]').should('contain', 'milk');

    // Select from autocomplete
    cy.get('[data-testid="suggestion-item"]').first().click();
    cy.get('[data-testid="search-input"]').should('have.value', 'milk');

    // Verify search results
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="product-card"]').should('contain', 'Milk');
  });

  it('should handle search with no results', () => {
    // Search for non-existent product
    cy.get('[data-testid="search-input"]').type('nonexistent product');
    cy.get('[data-testid="search-button"]').click();

    // Verify no results message
    cy.get('[data-testid="no-results-message"]').should('be.visible');
    cy.get('[data-testid="no-results-message"]').should('contain', 'No products found');
    cy.get('[data-testid="suggest-alternatives"]').should('be.visible');
  });

  it('should handle category browsing', () => {
    // Navigate to categories
    cy.get('[data-testid="categories-link"]').click();
    cy.get('[data-testid="categories-page"]').should('be.visible');

    // Browse dairy category
    cy.get('[data-testid="category-card-dairy"]').click();
    cy.get('[data-testid="category-products"]').should('be.visible');
    cy.get('[data-testid="product-card"]').should('contain', 'Milk');

    // Browse bakery category
    cy.get('[data-testid="category-card-bakery"]').click();
    cy.get('[data-testid="category-products"]').should('be.visible');
    cy.get('[data-testid="product-card"]').should('contain', 'Challah');
  });

  it('should handle store information display', () => {
    // Search for a product first
    cy.get('[data-testid="search-input"]').type('milk');
    cy.get('[data-testid="search-button"]').click();

    // Click on store information
    cy.get('[data-testid="store-info-button"]').first().click();
    cy.get('[data-testid="store-details-modal"]').should('be.visible');

    // Verify store information
    cy.get('[data-testid="store-name"]').should('be.visible');
    cy.get('[data-testid="store-location"]').should('be.visible');
    cy.get('[data-testid="store-hours"]').should('be.visible');
    cy.get('[data-testid="store-phone"]').should('be.visible');
    cy.get('[data-testid="store-rating"]').should('be.visible');

    // Close modal
    cy.get('[data-testid="close-modal-button"]').click();
    cy.get('[data-testid="store-details-modal"]').should('not.exist');
  });

  it('should handle price history display', () => {
    // Search for a product
    cy.get('[data-testid="search-input"]').type('milk');
    cy.get('[data-testid="search-button"]').click();

    // View product details
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="price-history-tab"]').click();

    // Verify price history
    cy.get('[data-testid="price-history-chart"]').should('be.visible');
    cy.get('[data-testid="price-history-data"]').should('have.length.greaterThan', 0);
  });

  it('should handle responsive design', () => {
    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('[data-testid="homepage"]').should('be.visible');
    cy.get('[data-testid="mobile-search"]').should('be.visible');
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible');

    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('[data-testid="homepage"]').should('be.visible');
    cy.get('[data-testid="tablet-layout"]').should('be.visible');

    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('[data-testid="homepage"]').should('be.visible');
    cy.get('[data-testid="desktop-layout"]').should('be.visible');
  });

  it('should handle error scenarios gracefully', () => {
    // Test network error during search
    cy.intercept('GET', '/api/products/search*', { forceNetworkError: true }).as('searchError');
    
    cy.get('[data-testid="search-input"]').type('milk');
    cy.get('[data-testid="search-button"]').click();

    // Verify error handling
    cy.get('[data-testid="error-message"]').should('contain', 'Search temporarily unavailable');
    cy.get('[data-testid="retry-button"]').should('be.visible');

    // Test form validation errors
    cy.get('[data-testid="request-product-button"]').click();
    cy.get('[data-testid="submit-request-button"]').click();

    // Verify validation errors
    cy.get('[data-testid="validation-error"]').should('contain', 'Product name is required');
    cy.get('[data-testid="validation-error"]').should('contain', 'Email is required');

    // Test invalid email format
    cy.get('[data-testid="user-email-input"]').type('invalid-email');
    cy.get('[data-testid="submit-request-button"]').click();
    cy.get('[data-testid="validation-error"]').should('contain', 'Invalid email format');
  });

  it('should handle accessibility features', () => {
    // Test keyboard navigation
    cy.get('[data-testid="search-input"]').focus();
    cy.get('[data-testid="search-input"]').type('milk');
    cy.get('[data-testid="search-input"]').type('{enter}');

    // Verify search results are accessible
    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="product-card"]').first().focus();
    cy.get('[data-testid="product-card"]').first().type('{enter}');

    // Test screen reader support
    cy.get('[data-testid="product-details"]').should('have.attr', 'aria-label');
    cy.get('[data-testid="price-comparison-table"]').should('have.attr', 'role', 'table');

    // Test high contrast mode
    cy.get('[data-testid="high-contrast-toggle"]').click();
    cy.get('[data-testid="product-card"]').should('have.class', 'high-contrast');
  });
});
