const adminAuth = (req, res, next) => {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  // CRITICAL: Ensure ADMIN_PASSWORD is set in production environments
  if (process.env.NODE_ENV === 'production' && (!ADMIN_PASSWORD || ADMIN_PASSWORD === 'temp-password-123')) {
    console.error('FATAL: ADMIN_PASSWORD is not set or is insecure. Server cannot start.');
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Admin authentication is not configured securely.'
    });
  }
  
  // Get password from headers or body
  const providedPassword = req.headers['x-admin-password'] || req.body.password;
  
  if (!providedPassword) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide an admin password.'
    });
  }
  
  // Securely compare the provided password with the environment variable
  if (providedPassword === ADMIN_PASSWORD) {
    next();
  } else {
    // Invalid credentials
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid admin password.'
    });
  }
};

module.exports = adminAuth;
