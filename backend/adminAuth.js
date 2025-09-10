const adminAuth = (req, res, next) => {
  // Valid PINs for admin access
  const VALID_PINS = ['050625', '331919'];
  const FAILSAFE_PASSWORD = '331919';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'temp-password-123';
  
  // Check for password/PIN in headers or body
  const password = req.headers['x-admin-password'] || req.body.password;
  
  if (!password) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide admin PIN or password'
    });
  }
  
  // Check if it's a valid PIN
  if (VALID_PINS.includes(password)) {
    // PIN is valid, allow access
    next();
    return;
  }
  
  // Check if it's the failsafe password
  if (password === FAILSAFE_PASSWORD) {
    // Failsafe password is valid, allow access
    next();
    return;
  }
  
  // Check if it's the legacy admin password (for backward compatibility)
  if (password === ADMIN_PASSWORD) {
    next();
    return;
  }
  
  // Invalid credentials
  return res.status(401).json({
    error: 'Unauthorized',
    message: 'Invalid PIN or password'
  });
};

module.exports = adminAuth;
