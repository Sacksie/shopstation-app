const request = require('supertest');
const app = require('../../server');
const dbOps = require('../../database/db-operations');

// Mock the database operations
jest.mock('../../database/db-operations');

describe('API Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const mockProducts = [
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

      dbOps.getProducts.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toEqual(mockProducts);
      expect(dbOps.getProducts).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      dbOps.getProducts.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/products')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/products/search', () => {
    it('should search products by term', async () => {
      const searchTerm = 'milk';
      const mockResults = [
        {
          id: 1,
          name: 'Milk',
          slug: 'milk',
          prices: []
        }
      ];

      dbOps.searchProducts.mockResolvedValue(mockResults);

      const response = await request(app)
        .get(`/api/products/search?q=${searchTerm}`)
        .expect(200);

      expect(response.body).toEqual(mockResults);
      expect(dbOps.searchProducts).toHaveBeenCalledWith(searchTerm);
    });

    it('should return 400 if no search term provided', async () => {
      await request(app)
        .get('/api/products/search')
        .expect(400);
    });
  });

  describe('POST /api/manual/add-price', () => {
    it('should add a new price for a product', async () => {
      const priceData = {
        store: 'B Kosher',
        productName: 'Milk',
        price: 2.75,
        unit: '2 pints'
      };

      dbOps.updateProductPrice.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', 'test123')
        .send(priceData)
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(dbOps.updateProductPrice).toHaveBeenCalledWith(
        'milk',
        'B Kosher',
        expect.objectContaining({
          price: 2.75,
          unit: '2 pints',
          updatedBy: 'admin'
        })
      );
    });

    it('should return 401 if admin password is missing', async () => {
      const priceData = {
        store: 'B Kosher',
        productName: 'Milk',
        price: 2.75,
        unit: '2 pints'
      };

      await request(app)
        .post('/api/manual/add-price')
        .send(priceData)
        .expect(401);
    });

    it('should return 401 if admin password is incorrect', async () => {
      const priceData = {
        store: 'B Kosher',
        productName: 'Milk',
        price: 2.75,
        unit: '2 pints'
      };

      await request(app)
        .post('/api/manual/add-price')
        .set('x-admin-password', 'wrongpassword')
        .send(priceData)
        .expect(401);
    });
  });

  describe('POST /api/manual/update-product-info', () => {
    it('should update product information', async () => {
      const updateData = {
        productSlug: 'milk',
        displayName: 'Fresh Milk',
        synonyms: ['fresh milk', 'dairy milk']
      };

      dbOps.updateProductInfo.mockResolvedValue({ success: true });

      const response = await request(app)
        .post('/api/manual/update-product-info')
        .set('x-admin-password', 'test123')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({ success: true });
      expect(dbOps.updateProductInfo).toHaveBeenCalledWith(
        'milk',
        expect.objectContaining({
          name: 'Fresh Milk',
          synonyms: ['fresh milk', 'dairy milk']
        })
      );
    });
  });

  describe('POST /api/product-requests', () => {
    it('should create a new product request', async () => {
      const requestData = {
        userName: 'John Doe',
        userEmail: 'john@example.com',
        productName: 'New Product',
        categorySuggestion: 'dairy',
        description: 'Looking for this product'
      };

      dbOps.addProductRequest.mockResolvedValue({
        success: true,
        requestId: 1,
        createdAt: new Date().toISOString()
      });

      const response = await request(app)
        .post('/api/product-requests')
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('requestId', 1);
      expect(dbOps.addProductRequest).toHaveBeenCalledWith(requestData);
    });

    it('should return 400 if required fields are missing', async () => {
      const incompleteData = {
        userName: 'John Doe'
        // Missing required fields
      };

      await request(app)
        .post('/api/product-requests')
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('GET /api/product-requests', () => {
    it('should return all product requests for admin', async () => {
      const mockRequests = [
        {
          id: 1,
          user_name: 'John Doe',
          product_name: 'New Product',
          status: 'pending'
        }
      ];

      dbOps.getProductRequests.mockResolvedValue(mockRequests);

      const response = await request(app)
        .get('/api/product-requests')
        .set('x-admin-password', 'test123')
        .expect(200);

      expect(response.body).toEqual(mockRequests);
      expect(dbOps.getProductRequests).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backup API Endpoints', () => {
    const backupManager = require('../../utils/backupManager');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('GET /api/backup/list', () => {
      it('should return list of backups', async () => {
        const mockBackups = [
          {
            filename: 'backup-2025-01-01T00-00-00-manual.sql',
            size: 1024,
            created: new Date()
          }
        ];

        backupManager.getBackupList.mockReturnValue(mockBackups);

        const response = await request(app)
          .get('/api/backup/list')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          backups: mockBackups
        });
      });
    });

    describe('POST /api/backup/create', () => {
      it('should create a manual backup', async () => {
        const mockResult = {
          success: true,
          filename: 'backup-2025-01-01T00-00-00-manual.sql',
          size: 2048
        };

        backupManager.manualBackup.mockImplementation((callback) => {
          callback(mockResult);
        });

        const response = await request(app)
          .post('/api/backup/create')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Backup created successfully.',
          backup: mockResult
        });
      });

      it('should handle backup creation failure', async () => {
        const mockResult = {
          success: false,
          error: 'Database connection failed'
        };

        backupManager.manualBackup.mockImplementation((callback) => {
          callback(mockResult);
        });

        const response = await request(app)
          .post('/api/backup/create')
          .expect(500);

        expect(response.body).toEqual({
          success: false,
          error: 'Database connection failed'
        });
      });
    });

    describe('POST /api/backup/restore-latest', () => {
      it('should restore from latest backup', async () => {
        const mockBackups = [
          {
            filename: 'backup-2025-01-01T00-00-00-manual.sql',
            size: 1024,
            created: new Date()
          }
        ];

        backupManager.getBackupList.mockReturnValue(mockBackups);
        backupManager.restoreFromBackup.mockImplementation((filename, callback) => {
          callback({ success: true, message: `Restored from ${filename}` });
        });

        const response = await request(app)
          .post('/api/backup/restore-latest')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          message: 'Restored from backup-2025-01-01T00-00-00-manual.sql'
        });
      });

      it('should return 404 if no backups exist', async () => {
        backupManager.getBackupList.mockReturnValue([]);

        const response = await request(app)
          .post('/api/backup/restore-latest')
          .expect(404);

        expect(response.body).toEqual({
          success: false,
          error: 'No backups found.'
        });
      });
    });
  });

  describe('Store Portal API Endpoints', () => {
    describe('POST /api/store-portal/login', () => {
      it('should authenticate store user', async () => {
        const loginData = {
          email: 'owner@koshercorner.com',
          password: 'password123'
        };

        const mockUser = {
          id: 1,
          email: 'owner@koshercorner.com',
          store_id: 1,
          role: 'owner'
        };

        dbOps.findStoreUserByEmail.mockResolvedValue(mockUser);
        dbOps.verifyUserPassword.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/store-portal/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
      });

      it('should return 401 for invalid credentials', async () => {
        const loginData = {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        };

        dbOps.findStoreUserByEmail.mockResolvedValue(null);

        const response = await request(app)
          .post('/api/store-portal/login')
          .send(loginData)
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid credentials');
      });
    });

    describe('GET /api/store-portal/products', () => {
      it('should return products for authenticated store', async () => {
        const mockProducts = [
          {
            id: 1,
            name: 'Milk',
            price: 2.5,
            unit: '2 pints'
          }
        ];

        dbOps.getProductsByStore.mockResolvedValue(mockProducts);

        // Mock JWT verification
        const mockToken = 'valid.jwt.token';
        const mockUser = { storeId: 1 };

        const response = await request(app)
          .get('/api/store-portal/products')
          .set('Authorization', `Bearer ${mockToken}`)
          .expect(200);

        expect(response.body).toEqual(mockProducts);
        expect(dbOps.getProductsByStore).toHaveBeenCalledWith(1);
      });
    });
  });
});
