const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Store data deletion requests
router.post('/data-deletion-request', (req, res) => {
  try {
    const { email, name, requestType, reason, dataTypes } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email and name are required'
      });
    }

    const requestData = {
      id: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      requestType,
      reason,
      dataTypes,
      timestamp: new Date().toISOString(),
      status: 'pending',
      processedAt: null
    };

    // Store the request (in production, this would go to a secure database)
    const requestsFile = path.join(__dirname, '../data/deletion-requests.json');
    let requests = [];
    
    if (fs.existsSync(requestsFile)) {
      requests = JSON.parse(fs.readFileSync(requestsFile, 'utf8'));
    }
    
    requests.push(requestData);
    
    // Ensure data directory exists
    const dataDir = path.dirname(requestsFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(requestsFile, JSON.stringify(requests, null, 2));

    // Log the request for admin attention
    console.log('🔒 GDPR Data Deletion Request received:', {
      id: requestData.id,
      email: requestData.email,
      requestType: requestData.requestType,
      timestamp: requestData.timestamp
    });

    res.json({
      success: true,
      data: {
        requestId: requestData.id,
        message: 'Data deletion request received. We will process it within 30 days as required by GDPR.',
        timestamp: requestData.timestamp
      }
    });

  } catch (error) {
    console.error('Error processing data deletion request:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Export user data (GDPR data portability)
router.post('/export-data', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // In a real implementation, you would gather all user data from various sources
    const userData = {
      userInfo: {
        email: email,
        exportedAt: new Date().toISOString(),
        exportRequestId: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      searchHistory: [], // Would contain actual search history
      preferences: {}, // Would contain user preferences
      analyticsData: {}, // Would contain analytics data
      feedbackSubmissions: [] // Would contain feedback data
    };

    console.log('📤 GDPR Data Export Request received:', {
      email: email,
      exportId: userData.userInfo.exportRequestId,
      timestamp: userData.userInfo.exportedAt
    });

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Cookie consent tracking
router.post('/cookie-consent', (req, res) => {
  try {
    const { preferences, timestamp } = req.body;
    
    const consentData = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      preferences,
      timestamp: timestamp || new Date().toISOString(),
      ipAddress: req.ip || req.connection.remoteAddress
    };

    // Store consent data (in production, this would go to a secure database)
    const consentsFile = path.join(__dirname, '../data/cookie-consents.json');
    let consents = [];
    
    if (fs.existsSync(consentsFile)) {
      consents = JSON.parse(fs.readFileSync(consentsFile, 'utf8'));
    }
    
    consents.push(consentData);
    
    // Keep only last 1000 consents to manage file size
    if (consents.length > 1000) {
      consents = consents.slice(-1000);
    }
    
    // Ensure data directory exists
    const dataDir = path.dirname(consentsFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(consentsFile, JSON.stringify(consents, null, 2));

    console.log('🍪 Cookie consent recorded:', {
      id: consentData.id,
      preferences: consentData.preferences,
      timestamp: consentData.timestamp
    });

    res.json({
      success: true,
      data: {
        consentId: consentData.id,
        message: 'Cookie preferences saved successfully'
      }
    });

  } catch (error) {
    console.error('Error saving cookie consent:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get privacy information
router.get('/privacy-info', (req, res) => {
  try {
    const privacyInfo = {
      dataController: {
        name: 'ShopStation',
        email: 'gavrielsacks21@gmail.com',
        address: 'London, UK'
      },
      dataProcessed: [
        'Search queries and shopping lists',
        'Analytics and usage data',
        'Feedback and survey responses',
        'IP addresses and device information',
        'Cookie preferences'
      ],
      legalBases: [
        'Legitimate interest for service provision',
        'Consent for marketing and analytics',
        'Legal obligation for compliance'
      ],
      retentionPeriod: '24 months for inactive accounts',
      rights: [
        'Access your personal data',
        'Rectify inaccurate data',
        'Request erasure of your data',
        'Data portability',
        'Object to processing',
        'Restrict processing'
      ],
      lastUpdated: '2025-08-21'
    };

    res.json({
      success: true,
      data: privacyInfo
    });

  } catch (error) {
    console.error('Error getting privacy info:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;