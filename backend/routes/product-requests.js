const express = require('express');
const router = express.Router();
const dbOperations = require('../database/db-operations');

/**
 * Product Request System - Phase 1 MVP
 * Allows users to request products that aren't currently in the system
 */

// Submit a new product request
router.post('/submit', async (req, res) => {
  try {
    const { productName, preferredBrand, userEmail, userName, categorySuggestion, description } = req.body;
    
    // Validation
    if (!productName || !productName.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Product name is required' 
      });
    }

    // Create the request
    const requestData = {
      product_name: productName.trim(),
      preferred_brand: preferredBrand?.trim() || null,
      user_email: userEmail?.trim() || null,
      user_name: userName?.trim() || null,
      category_suggestion: categorySuggestion?.trim() || null,
      description: description?.trim() || null,
      status: 'pending',
      created_at: new Date()
    };

    let result;
    if (dbOperations.usePostgreSQL) {
      // PostgreSQL implementation
      const query = `
        INSERT INTO product_requests 
        (product_name, preferred_brand, user_email, user_name, category_suggestion, description, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at
      `;
      const values = [
        requestData.product_name,
        requestData.preferred_brand,
        requestData.user_email,
        requestData.user_name,
        requestData.category_suggestion,
        requestData.description,
        requestData.status
      ];
      
      result = await dbOperations.query(query, values);
    } else {
      // JSON fallback for development
      const data = await dbOperations.readJSONData();
      const requests = data.product_requests || [];
      
      const newRequest = {
        id: Date.now().toString(),
        ...requestData
      };
      
      requests.push(newRequest);
      data.product_requests = requests;
      
      await dbOperations.writeJSONData(data);
      result = { rows: [{ id: newRequest.id, created_at: newRequest.created_at }] };
    }

    // Success response
    res.json({
      success: true,
      message: 'Product request submitted successfully!',
      requestId: result.rows[0].id,
      timestamp: result.rows[0].created_at
    });

    // TODO: Send notification to admin (Phase 1.5)
    console.log(`📝 New product request: ${productName} from ${userEmail || 'anonymous'}`);

  } catch (error) {
    console.error('Error submitting product request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit product request. Please try again.'
    });
  }
});

// Get all product requests (admin only)
router.get('/admin/all', async (req, res) => {
  try {
    let requests;
    
    if (dbOperations.usePostgreSQL) {
      const query = `
        SELECT * FROM product_requests 
        ORDER BY created_at DESC
      `;
      const result = await dbOperations.query(query);
      requests = result.rows;
    } else {
      const data = await dbOperations.readJSONData();
      requests = data.product_requests || [];
    }

    res.json({
      success: true,
      requests: requests,
      total: requests.length
    });

  } catch (error) {
    console.error('Error fetching product requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product requests'
    });
  }
});

// Update request status (admin only)
router.put('/admin/:requestId/status', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, notes, processedBy } = req.body;

    if (!['pending', 'approved', 'rejected', 'added'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: pending, approved, rejected, or added'
      });
    }

    let result;
    if (dbOperations.usePostgreSQL) {
      const query = `
        UPDATE product_requests 
        SET status = $1, notes = $2, processed_by = $3, processed_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `;
      const values = [status, notes, processedBy, requestId];
      result = await dbOperations.query(query, values);
    } else {
      const data = await dbOperations.readJSONData();
      const requests = data.product_requests || [];
      const requestIndex = requests.findIndex(r => r.id === requestId);
      
      if (requestIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Product request not found'
        });
      }

      requests[requestIndex] = {
        ...requests[requestIndex],
        status,
        notes: notes || null,
        processed_by: processedBy || null,
        processed_at: new Date()
      };

      data.product_requests = requests;
      await dbOperations.writeJSONData(data);
      result = { rows: [requests[requestIndex]] };
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Product request not found'
      });
    }

    res.json({
      success: true,
      message: 'Request status updated successfully',
      request: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request status'
    });
  }
});

// Get request statistics (admin dashboard)
router.get('/admin/stats', async (req, res) => {
  try {
    let requests;
    
    if (dbOperations.usePostgreSQL) {
      const query = `
        SELECT status, COUNT(*) as count 
        FROM product_requests 
        GROUP BY status
      `;
      const result = await dbOperations.query(query);
      requests = result.rows;
    } else {
      const data = await dbOperations.readJSONData();
      const allRequests = data.product_requests || [];
      
      const statusCounts = {};
      allRequests.forEach(req => {
        statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
      });
      
      requests = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));
    }

    const total = requests.reduce((sum, item) => sum + parseInt(item.count), 0);
    const pending = requests.find(item => item.status === 'pending')?.count || 0;

    res.json({
      success: true,
      stats: {
        total,
        pending,
        byStatus: requests
      }
    });

  } catch (error) {
    console.error('Error fetching request stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch request statistics'
    });
  }
});

module.exports = router;
