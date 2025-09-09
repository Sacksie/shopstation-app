# Store Portal Deployment Checklist

## 🚨 CRITICAL: Pre-Deployment Requirements

### 1. Database Migration & Setup
**MUST COMPLETE BEFORE TESTING:**

```bash
# 1. Connect to your PostgreSQL database
psql -h your-host -U your-user -d your-database

# 2. Run the migrations in order:
\i backend/migrations/001-add-store-users.sql
\i backend/migrations/002-add-search-analytics.sql

# 3. Verify tables were created:
\dt
# Should show: store_users, search_analytics

# 4. Exit psql
\q
```

### 2. Create Test Store User Accounts
**Create accounts for your four Kosher stores:**

```bash
# Run the user creation script
cd backend
npm run portal:create-users

# This will create test accounts for:
# - owner@koshercorner.com / koshercorner123 (owner)
# - manager@bkosher.com / bkosher123 (manager)  
# - owner@tapuach.com / tapuach123 (owner)
# - staff@grodzinski.com / grodzinski123 (staff)
```

### 3. Environment Configuration
**Ensure these environment variables are set:**

```bash
# Required for JWT authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Database connection (already configured)
DATABASE_URL=your-postgresql-connection-string

# Optional: Set to production for security
NODE_ENV=production
```

## 🧪 Testing Protocol

### Phase 1: Unit Testing
```bash
# Run all portal unit tests
npm run test:portal:unit

# Expected output: All authentication and endpoint tests pass
```

### Phase 2: Integration Testing
```bash
# Test database operations
npm run test:portal:integration

# Expected output: All database queries and operations work correctly
```

### Phase 3: Security Testing
```bash
# Test security features
npm run test:portal:security

# Expected output: All security tests pass (SQL injection, XSS, etc.)
```

### Phase 4: Coverage Testing
```bash
# Check code coverage
npm run test:portal:coverage

# Expected output: Coverage >= 80%
```

### Phase 5: Full System Testing
```bash
# Run all portal tests
npm run test:portal

# Expected output: All tests pass with comprehensive report
```

## 🔐 Security Validation

### Authentication Testing
```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/portal/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@koshercorner.com","password":"koshercorner123"}'

# Expected: Returns JWT token and user info
```

### Authorization Testing
```bash
# Test protected endpoint without token
curl -X GET http://localhost:3000/api/portal/dashboard-summary

# Expected: Returns 401 Unauthorized

# Test protected endpoint with valid token
curl -X GET http://localhost:3000/api/portal/dashboard-summary \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Expected: Returns dashboard data
```

### Store Data Isolation Testing
```bash
# Login as different store users and verify they only see their own data
# This is automatically tested in the test suite
```

## 📊 Database Validation

### Verify Store Users Table
```sql
-- Check that users were created
SELECT 
  su.email,
  su.role,
  s.name as store_name,
  su.created_at
FROM store_users su
JOIN stores s ON su.store_id = s.id
ORDER BY su.created_at DESC;
```

### Verify Search Analytics Table
```sql
-- Check analytics table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'search_analytics'
ORDER BY ordinal_position;
```

### Test Database Operations
```bash
# Test database connectivity
curl http://localhost:3000/api/health

# Expected: Returns database status
```

## 🌐 Frontend Integration Testing

### Update Frontend Configuration
1. **Modify StorePortal.js** to use real API endpoints
2. **Add authentication flow** - login form and token storage
3. **Test all portal tabs** with live data
4. **Verify error handling** for authentication failures

### Test Frontend-Backend Integration
```bash
# Start backend server
npm start

# In another terminal, start frontend
cd ../frontend
npm start

# Test complete user flow:
# 1. Navigate to Store Portal
# 2. Login with test credentials
# 3. Verify all tabs load with real data
# 4. Test price updates
# 5. Verify data persistence
```

## 🚀 Deployment Steps

### Pre-Deployment Checklist
- [ ] All migrations applied to production database
- [ ] Test user accounts created
- [ ] All tests passing (unit, integration, security)
- [ ] Code coverage >= 80%
- [ ] Frontend updated to use new API endpoints
- [ ] Error handling and logging verified
- [ ] Performance benchmarks met
- [ ] Security validations passed

### Production Deployment
```bash
# 1. Run final quality gates
npm run quality-gates:strict

# 2. Deploy to production (via GitHub - your preferred method)
git add .
git commit -m "feat: Store Portal backend implementation with comprehensive testing"
git push origin main

# 3. Verify deployment
npm run verify:deployment
```

### Post-Deployment Validation
- [ ] Monitor error logs for authentication issues
- [ ] Verify store users can log in successfully
- [ ] Test all portal features with real data
- [ ] Monitor database performance
- [ ] Collect user feedback from initial store partners

## 📈 Success Metrics

### Phase 1 (Current Implementation)
- [ ] Store owners can successfully log in
- [ ] All portal tabs display live data
- [ ] Price updates work correctly
- [ ] No security vulnerabilities
- [ ] All tests pass with 80%+ coverage

### Performance Benchmarks
- [ ] Login response time < 500ms
- [ ] Dashboard load time < 2s
- [ ] Price update response time < 1s
- [ ] Database queries optimized
- [ ] No memory leaks detected

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
npm run check:railway-postgres

# Verify environment variables
npm run check-env
```

#### Authentication Failures
```bash
# Check JWT secret is set
echo $JWT_SECRET

# Verify user exists in database
npm run portal:list-users
```

#### Test Failures
```bash
# Run specific test suites
npm run test:portal:unit
npm run test:portal:integration
npm run test:portal:security

# Check test coverage
npm run test:portal:coverage
```

### Emergency Rollback
```bash
# If deployment fails, rollback migrations
npm run migrate:rollback

# Restart with previous version
git checkout previous-stable-commit
npm start
```

## 📞 Support & Monitoring

### Log Monitoring
- Monitor `/backend/logs/` for error logs
- Check application performance metrics
- Watch for authentication failures
- Monitor database query performance

### User Support
- Provide test credentials to store partners
- Monitor user feedback and issues
- Track login success rates
- Monitor portal usage analytics

## 🎯 Next Steps After Deployment

### Phase 2: Operational Efficiency (Next 2-4 weeks)
- [ ] Implement bulk pricing tools
- [ ] Add inventory & demand integration
- [ ] Create advanced analytics dashboard
- [ ] Add price change history tracking

### Phase 3: Advanced Growth Features (Next 1-3 months)
- [ ] Implement predictive analytics
- [ ] Add community-specific tools
- [ ] Integrate with POS systems
- [ ] Add supplier API connections

---

## ✅ Final Deployment Sign-off

**Deployment Approved By:**
- [ ] Technical Lead: _________________ Date: _______
- [ ] Security Review: _________________ Date: _______
- [ ] Business Owner: _________________ Date: _______

**Deployment Completed:**
- [ ] Production deployment successful
- [ ] All tests passing
- [ ] User acceptance testing complete
- [ ] Monitoring and alerting configured
- [ ] Documentation updated

**Go-Live Date:** _________________

**Store Portal is now LIVE and ready for store partners! 🎉**
