const dbOps = require('../../database/db-operations');
const database = require('../../database/db-connection');

// Mock the database connection
jest.mock('../../database/db-connection');

describe('Database Operations', () => {
  let mockQuery;
  let mockTransaction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock functions
    mockQuery = jest.fn();
    mockTransaction = jest.fn();
    
    // Mock the database module
    database.query = mockQuery;
    database.transaction = mockTransaction;
  });

  describe('createStoreUser', () => {
    it('should create a new store user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        storeId: 1,
        role: 'staff'
      };

      const expectedResult = {
        id: 1,
        email: 'test@example.com',
        role: 'staff',
        created_at: new Date().toISOString()
      };

      mockQuery.mockResolvedValue({ rows: [expectedResult] });

      const result = await dbOps.createStoreUser(userData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO store_users'),
        expect.arrayContaining([
          'test@example.com',
          expect.any(String), // hashed password
          1,
          'staff'
        ])
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findStoreUserByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      const expectedUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        store_id: 1,
        role: 'staff'
      };

      mockQuery.mockResolvedValue({ rows: [expectedUser] });

      const result = await dbOps.findStoreUserByEmail(email);

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT * FROM store_users WHERE email = $1',
        [email]
      );
      expect(result).toEqual(expectedUser);
    });

    it('should return undefined if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await dbOps.findStoreUserByEmail('nonexistent@example.com');

      expect(result).toBeUndefined();
    });
  });

  describe('getStores', () => {
    it('should return all active stores', async () => {
      const expectedStores = [
        { id: 1, name: 'B Kosher', location: 'Hendon', is_active: true },
        { id: 2, name: 'Tapuach', location: 'Hendon', is_active: true }
      ];

      mockQuery.mockResolvedValue({ rows: expectedStores });

      const result = await dbOps.getStores();

      expect(mockQuery).toHaveBeenCalled();
      expect(mockQuery.mock.calls[0][0]).toContain('SELECT');
      // Some queries don't have parameters, so check if they exist
      if (mockQuery.mock.calls[0][1] !== undefined) {
        expect(mockQuery.mock.calls[0][1]).toEqual([]);
      }
      expect(result).toEqual(expectedStores);
    });
  });

  describe('getProducts', () => {
    it('should return all products with prices', async () => {
      const expectedProducts = [
        {
          id: 1,
          name: 'Milk',
          slug: 'milk',
          category_name: 'dairy',
          prices: [
            { store_name: 'B Kosher', price: 2.5, unit: '2 pints' }
          ]
        }
      ];

      mockQuery.mockResolvedValue({ rows: expectedProducts });

      const result = await dbOps.getProducts();

      expect(mockQuery).toHaveBeenCalled();
      expect(mockQuery.mock.calls[0][0]).toContain('SELECT');
      // Some queries don't have parameters, so check if they exist
      if (mockQuery.mock.calls[0][1] !== undefined) {
        expect(mockQuery.mock.calls[0][1]).toEqual([]);
      }
      expect(result).toEqual(expectedProducts);
    });
  });

  describe('searchProducts', () => {
    it('should search products by name', async () => {
      const searchTerm = 'milk';
      const expectedResults = [
        {
          id: 1,
          name: 'Milk',
          slug: 'milk',
          prices: []
        }
      ];

      mockQuery.mockResolvedValue({ rows: expectedResults });

      const result = await dbOps.searchProducts(searchTerm);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [`%${searchTerm}%`]
      );
      expect(result).toEqual(expectedResults);
    });
  });

  describe('addProduct', () => {
    it('should add a new product', async () => {
      const productData = {
        name: 'Test Product',
        slug: 'test-product',
        categoryId: 1,
        synonyms: ['test', 'product'],
        commonBrands: ['Brand A']
      };

      const expectedResult = [{ rows: [{ id: 1 }] }];
      mockTransaction.mockResolvedValue(expectedResult);

      const result = await dbOps.addProduct(productData);

      expect(mockTransaction).toHaveBeenCalledWith([
        {
          query: expect.stringContaining('INSERT INTO products'),
          params: [
            'Test Product',
            'test-product',
            1,
            ['test', 'product'],
            ['Brand A']
          ]
        }
      ]);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateProductPrice', () => {
    it('should update product price for a store', async () => {
      const productSlug = 'milk';
      const storeName = 'B Kosher';
      const priceData = {
        price: 2.75,
        unit: '2 pints',
        updatedBy: 'admin'
      };

      // Mock the product and store queries
      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // product query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // store query
        .mockResolvedValueOnce({ rows: [] }); // update query

      const result = await dbOps.updateProductPrice(productSlug, storeName, priceData);

      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });

    it('should throw error if product or store not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await expect(
        dbOps.updateProductPrice('nonexistent', 'nonexistent', { price: 1.0 })
      ).rejects.toThrow('Product or store not found');
    });
  });

  describe('updateStoreProductPrice', () => {
    it('should update store product price', async () => {
      const storeId = 1;
      const productId = 1;
      const newPrice = 2.99;

      const expectedResult = {
        store_id: 1,
        product_id: 1,
        price: 2.99,
        last_updated: new Date()
      };

      mockQuery.mockResolvedValue({ 
        rows: [expectedResult],
        rowCount: 1
      });

      const result = await dbOps.updateStoreProductPrice(storeId, productId, newPrice);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE store_products'),
        [2.99, 1, 1]
      );
      expect(result).toEqual({
        success: true,
        updatedProduct: expectedResult
      });
    });

    it('should throw error if product not found', async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 });

      await expect(
        dbOps.updateStoreProductPrice(1, 999, 2.99)
      ).rejects.toThrow('Product not found for this store');
    });
  });

  describe('deleteProduct', () => {
    it('should soft delete a product', async () => {
      const productSlug = 'milk';
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const result = await dbOps.deleteProduct(productSlug);

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE products SET is_active = false WHERE slug = $1',
        [productSlug]
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('addProductRequest', () => {
    it('should add a product request', async () => {
      const requestData = {
        userName: 'John Doe',
        userEmail: 'john@example.com',
        productName: 'New Product',
        categorySuggestion: 'dairy',
        description: 'Looking for this product'
      };

      const expectedResult = {
        id: 1,
        created_at: new Date().toISOString()
      };

      mockQuery.mockResolvedValue({ rows: [expectedResult] });

      const result = await dbOps.addProductRequest(requestData);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO product_requests'),
        [
          'John Doe',
          'john@example.com',
          'New Product',
          'dairy',
          'Looking for this product'
        ]
      );
      expect(result).toEqual({
        success: true,
        requestId: 1,
        createdAt: expectedResult.created_at
      });
    });
  });

  describe('getProductRequests', () => {
    it('should return all product requests', async () => {
      const expectedRequests = [
        {
          id: 1,
          user_name: 'John Doe',
          product_name: 'New Product',
          status: 'pending'
        }
      ];

      mockQuery.mockResolvedValue({ rows: expectedRequests });

      const result = await dbOps.getProductRequests();

      expect(mockQuery).toHaveBeenCalled();
      expect(mockQuery.mock.calls[0][0]).toContain('SELECT');
      // Some queries don't have parameters, so check if they exist
      if (mockQuery.mock.calls[0][1] !== undefined) {
        expect(mockQuery.mock.calls[0][1]).toEqual([]);
      }
      expect(result).toEqual(expectedRequests);
    });
  });
});
