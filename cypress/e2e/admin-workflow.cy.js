describe('Master Admin Workflow', () => {
  beforeEach(() => {
    // Set up test data
    cy.loginAsAdmin();
    cy.visit('/admin');
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it('should complete full admin workflow: login, add product, update price, create backup', () => {
    // Step 1: Verify admin panel loads
    cy.get('[data-testid="admin-panel"]').should('be.visible');
    cy.get('[data-testid="inventory-tab"]').should('be.visible');
    cy.get('[data-testid="add-product-tab"]').should('be.visible');
    cy.get('[data-testid="backup-tab"]').should('be.visible');

    // Step 2: Add a new product
    cy.get('[data-testid="add-product-tab"]').click();
    cy.get('[data-testid="product-name-input"]').type('E2E Test Product');
    cy.get('[data-testid="category-select"]').select('dairy');
    cy.get('[data-testid="add-product-button"]').click();

    // Verify product was added
    cy.get('[data-testid="success-message"]').should('contain', 'Product added successfully');
    
    // Step 3: Switch to inventory and add price
    cy.get('[data-testid="inventory-tab"]').click();
    cy.get('[data-testid="product-search"]').type('E2E Test Product');
    cy.get('[data-testid="search-button"]').click();

    // Wait for search results
    cy.get('[data-testid="product-row"]').should('contain', 'E2E Test Product');

    // Add price for B Kosher store
    cy.get('[data-testid="price-cell-B-Kosher"]').dblclick();
    cy.get('[data-testid="price-input"]').clear().type('5.99');
    cy.get('[data-testid="unit-input"]').clear().type('item');
    cy.get('[data-testid="save-price-button"]').click();

    // Verify price was saved
    cy.get('[data-testid="success-message"]').should('contain', 'Price updated successfully');
    cy.get('[data-testid="price-cell-B-Kosher"]').should('contain', '5.99');

    // Step 4: Create backup
    cy.get('[data-testid="backup-tab"]').click();
    cy.get('[data-testid="create-backup-button"]').click();

    // Verify backup was created
    cy.get('[data-testid="success-message"]').should('contain', 'Backup created successfully');
    cy.get('[data-testid="backup-list"]').should('contain', 'backup-');

    // Step 5: Verify data in database
    cy.verifyDatabaseState(
      "SELECT * FROM products WHERE name = 'E2E Test Product'",
      [{ name: 'E2E Test Product', category: 'dairy' }]
    );

    cy.verifyDatabaseState(
      "SELECT p.name, sp.price FROM products p JOIN store_products sp ON p.id = sp.product_id WHERE p.name = 'E2E Test Product'",
      [{ name: 'E2E Test Product', price: 5.99 }]
    );
  });

  it('should handle product search and filtering', () => {
    // Add test products
    cy.createTestProduct({
      name: 'Test Milk',
      category: 'dairy',
      synonyms: ['fresh milk', 'whole milk']
    });

    cy.createTestProduct({
      name: 'Test Challah',
      category: 'bakery',
      synonyms: ['bread', 'shabbat bread']
    });

    // Test search functionality
    cy.get('[data-testid="product-search"]').type('milk');
    cy.get('[data-testid="search-button"]').click();

    // Verify search results
    cy.get('[data-testid="product-row"]').should('contain', 'Test Milk');
    cy.get('[data-testid="product-row"]').should('not.contain', 'Test Challah');

    // Test category filtering
    cy.get('[data-testid="category-filter"]').select('bakery');
    cy.get('[data-testid="filter-button"]').click();

    // Verify filtered results
    cy.get('[data-testid="product-row"]').should('contain', 'Test Challah');
    cy.get('[data-testid="product-row"]').should('not.contain', 'Test Milk');
  });

  it('should handle bulk operations', () => {
    // Add multiple test products
    const products = [
      { name: 'Bulk Product 1', category: 'dairy' },
      { name: 'Bulk Product 2', category: 'dairy' },
      { name: 'Bulk Product 3', category: 'bakery' }
    ];

    products.forEach(product => {
      cy.createTestProduct(product);
    });

    // Select multiple products for bulk operation
    cy.get('[data-testid="select-all-checkbox"]').check();
    cy.get('[data-testid="bulk-action-select"]').select('update-category');
    cy.get('[data-testid="bulk-category-select"]').select('pantry');
    cy.get('[data-testid="bulk-update-button"]').click();

    // Verify bulk operation success
    cy.get('[data-testid="success-message"]').should('contain', 'Bulk update completed');
    
    // Verify products were updated
    cy.get('[data-testid="product-row"]').each(($row) => {
      cy.wrap($row).should('contain', 'pantry');
    });
  });

  it('should handle backup and restore operations', () => {
    // Create initial backup
    cy.get('[data-testid="backup-tab"]').click();
    cy.get('[data-testid="create-backup-button"]').click();
    cy.get('[data-testid="success-message"]').should('contain', 'Backup created successfully');

    // Add some test data
    cy.get('[data-testid="add-product-tab"]').click();
    cy.get('[data-testid="product-name-input"]').type('Pre-Restore Product');
    cy.get('[data-testid="category-select"]').select('dairy');
    cy.get('[data-testid="add-product-button"]').click();

    // Verify product exists
    cy.get('[data-testid="inventory-tab"]').click();
    cy.get('[data-testid="product-search"]').type('Pre-Restore Product');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="product-row"]').should('contain', 'Pre-Restore Product');

    // Restore from backup
    cy.get('[data-testid="backup-tab"]').click();
    cy.get('[data-testid="restore-latest-button"]').click();
    cy.get('[data-testid="confirm-restore-button"]').click();

    // Verify restore success
    cy.get('[data-testid="success-message"]').should('contain', 'Database restored successfully');

    // Verify test data was removed
    cy.get('[data-testid="inventory-tab"]').click();
    cy.get('[data-testid="product-search"]').type('Pre-Restore Product');
    cy.get('[data-testid="search-button"]').click();
    cy.get('[data-testid="no-results-message"]').should('be.visible');
  });

  it('should handle error scenarios gracefully', () => {
    // Test invalid product data
    cy.get('[data-testid="add-product-tab"]').click();
    cy.get('[data-testid="add-product-button"]').click(); // Submit without data

    // Verify validation errors
    cy.get('[data-testid="error-message"]').should('contain', 'Product name is required');

    // Test invalid price data
    cy.get('[data-testid="inventory-tab"]').click();
    cy.get('[data-testid="product-row"]').first().within(() => {
      cy.get('[data-testid="price-cell"]').first().dblclick();
      cy.get('[data-testid="price-input"]').clear().type('invalid-price');
      cy.get('[data-testid="save-price-button"]').click();
    });

    // Verify price validation error
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid price format');

    // Test network error handling
    cy.intercept('POST', '/api/manual/add-product', { forceNetworkError: true }).as('networkError');
    
    cy.get('[data-testid="add-product-tab"]').click();
    cy.get('[data-testid="product-name-input"]').type('Network Test Product');
    cy.get('[data-testid="add-product-button"]').click();

    // Verify network error handling
    cy.get('[data-testid="error-message"]').should('contain', 'Network error');
  });
});
