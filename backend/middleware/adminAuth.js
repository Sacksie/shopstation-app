const adminAuth = (req, res, next) => {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'temp-password-123';
  
  // Check for password in headers or body
  const password = req.headers['x-admin-password'] || req.body.password;
  
  if (!password) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide admin password'
    });
  }
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid admin password'
    });
  }
  
  // Remove password from body if present
  if (req.body && req.body.password) {
    delete req.body.password;
  }
  
  next();
};

module.exports = adminAuth;
