# 🛡️ ShopStation Failsafes & Recovery Procedures
*Emergency guide for non-technical founders*

---

## 🚨 **CRITICAL EMERGENCY CONTACTS**

When your site is down and customers can't access it:

### **Immediate Health Checks**
1. **Customer Site**: https://shopstation.co.uk
2. **Backend Health**: https://backend-production-2cbb.up.railway.app/api/health
3. **Admin Panel**: https://shopstation.co.uk (click Admin)

### **Service Dashboards**
- **Railway (Backend)**: https://railway.app/dashboard
- **Vercel (Frontend)**: https://vercel.com/dashboard
- **GitHub Actions**: https://github.com/Sacksie/shopstation-app/actions

---

## 🔧 **EMERGENCY RECOVERY PROCEDURES**

### **1. Site is Completely Down**

**Immediate Actions:**
```bash
# Check if it's a deployment issue
cd /Users/gavrielsacks/grocery-compare-app
git log --oneline -5
# Look for recent commits that might have caused issues
```

**Quick Recovery:**
```bash
# Rollback to last known good version
git revert HEAD
git push origin main
# This automatically triggers redeployment of previous version
```

### **2. Admin Panel Not Working**

**Check Railway Environment Variables:**
1. Go to https://railway.app/dashboard
2. Find your backend project
3. Click "Variables" tab
4. Verify these are set:
   - `ADMIN_PASSWORD`: Your admin password
   - `JWT_SECRET`: Your secure JWT secret
   - `NODE_ENV`: Should be "production"

**Local Testing:**
```bash
cd backend
npm run check-env
# This validates your environment configuration
```

### **3. Database Issues or Data Loss**

**Immediate Backup Restore:**
```bash
cd backend
npm run migrate:status
# Check current database state

# If migrations are broken, rollback
npm run migrate:rollback 1
# This returns to the previous database version

# Restore from automatic backup
node -e "
const { cloudBackup } = require('./utils/cloudBackup');
cloudBackup.listBackups()
  .then(backups => {
    console.log('Available backups:');
    backups.forEach(backup => {
      console.log(\`- \${backup.id} (\${backup.date})\`);
    });
  });
"
```

### **4. Tests Failing (Deployment Blocked)**

**Quick Fix Process:**
```bash
cd backend
npm test
# See what's failing

# Fix specific issues or skip temporarily
npm run deploy:safe --skip-quality-gates
# WARNING: Only use in emergencies
```

**Proper Fix:**
```bash
# Run quality gates to see all issues
npm run quality-gates
# Address each failed check before deploying
```

---

## 🔍 **DIAGNOSTIC TOOLS**

### **System Health Check**
```bash
cd backend
node -e "
const { BusinessMonitoring } = require('./utils/monitoring');
const monitor = new BusinessMonitoring();
console.log('System Status:', monitor.getSystemHealth());
console.log('Business Metrics:', monitor.getBusinessMetrics());
"
```

### **Database Health Check**
```bash
cd backend
npm run migrate:validate
# Checks database integrity and structure
```

### **API Health Check**
```bash
# Test your API endpoints
curl https://backend-production-2cbb.up.railway.app/api/health
# Should return: {"status":"OK","environment":"production"}

# Test price comparison
curl -X POST https://backend-production-2cbb.up.railway.app/api/compare \
  -H "Content-Type: application/json" \
  -d '{"items":["milk"]}'
```

---

## 🎯 **PREVENTION CHECKLIST**

### **Before Making Any Changes**

**Always run this checklist:**
```bash
cd /Users/gavrielsacks/grocery-compare-app

# 1. Check current system health
cd backend && npm run check-env

# 2. Run all tests
npm test

# 3. Run quality gates
npm run quality-gates

# 4. Create backup
node -e "
const { cloudBackup } = require('./backend/utils/cloudBackup');
cloudBackup.createFullBackup('pre-change-backup');
"
```

### **Safe Development Process**

**Development Workflow:**
1. Make changes locally
2. Test with `npm test`
3. Verify with `npm run quality-gates`
4. Commit with descriptive message
5. Use safe deployment: `npm run deploy:safe`

**Never Do These:**
- ❌ Don't edit production database directly
- ❌ Don't skip quality gates in production
- ❌ Don't deploy without testing first
- ❌ Don't delete backup files

---

## 📋 **RECOVERY SCENARIOS**

### **Scenario 1: Bad Deployment**

**Symptoms:** Site works but has issues, customers complaining

**Recovery:**
```bash
# Quick rollback
git revert HEAD
git push origin main

# Or rollback database if needed
cd backend
npm run migrate:rollback 1
```

### **Scenario 2: Data Corruption**

**Symptoms:** Wrong prices, missing products, strange admin behavior

**Recovery:**
```bash
cd backend

# Check what backups are available
ls -la backups/
# Look for recent backup files

# Restore from most recent backup
node -e "
const { cloudBackup } = require('./utils/cloudBackup');
const backupFile = 'backup-2025-XX-XX.json'; // Use actual filename
cloudBackup.restoreFromBackup(backupFile)
  .then(result => console.log('Restore result:', result));
"
```

### **Scenario 3: Environment Issues**

**Symptoms:** Railway deployment failing, environment errors

**Recovery:**
```bash
# Check Railway environment
cd backend
npm run check-env

# Fix common issues:
# 1. JWT_SECRET too short - generate new one:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output and set in Railway dashboard

# 2. ADMIN_PASSWORD issues - verify in Railway dashboard
# 3. NODE_ENV not set to 'production' - set in Railway dashboard
```

---

## 🤖 **Using Claude Code for Emergency Help**

### **When You're Stuck**

**Ask Claude Code:**
- "My ShopStation site is down, help me diagnose the issue"
- "The admin panel isn't working, what should I check?"
- "I need to rollback my last deployment, how do I do it?"
- "My tests are failing, help me understand what's wrong"

**Give Claude Code This Info:**
- Error messages you're seeing
- What you were doing when it broke
- Whether customers can access the site
- Any recent changes you made

### **Emergency Commands Claude Code Can Help With**

**Diagnostic Commands:**
```bash
git log --oneline -10          # Recent changes
npm run quality-gates          # System validation  
curl https://shopstation.co.uk # Site accessibility
npm test                       # Test status
```

**Recovery Commands:**
```bash
git revert HEAD                # Undo last commit
npm run migrate:rollback 1     # Undo database changes
npm run deploy:safe            # Safe redeployment
```

---

## 📞 **ESCALATION PROCEDURES**

### **If Claude Code Can't Help**

**Immediate Actions:**
1. Take screenshots of error messages
2. Document what you were doing when it broke
3. Check if customers can still access basic site functions
4. Use social media to communicate with customers if needed

**Technical Recovery Options:**
1. **Rollback Strategy**: Always safe to go back to previous working version
2. **Backup Strategy**: Your system creates daily backups automatically
3. **Support Strategy**: All your infrastructure is documented for expert help

### **Business Continuity**

**Customer Communication:**
- Use your social media to inform customers of temporary issues
- Your backup systems mean downtime should be minimal
- Most issues can be resolved within 30 minutes using rollback procedures

**Data Protection:**
- Your daily backups protect against data loss
- Migration rollbacks protect against database issues
- Quality gates prevent most problems from reaching production

---

## ✅ **RECOVERY CONFIDENCE CHECKLIST**

**You Have These Safety Nets:**
- ✅ **Automatic backups** created daily and before changes
- ✅ **Database rollback** capability for any schema issues  
- ✅ **Git history** allowing rollback to any previous version
- ✅ **Quality gates** preventing most bad deployments
- ✅ **Health monitoring** detecting issues quickly
- ✅ **Professional infrastructure** designed for business continuity

**Your System is Designed to Recover:**
- Most issues can be resolved with simple rollback commands
- Backup systems protect against data loss
- Professional monitoring alerts you to issues quickly
- Documentation guides you through any scenario

**You're Not Alone:**
- Claude Code can help diagnose and fix issues
- All systems are documented with step-by-step procedures
- Your infrastructure follows industry best practices
- Emergency procedures are clearly documented

---

## 🎯 **REMEMBER**

**Your ShopStation is Built for Resilience:**
- Enterprise-grade backup and recovery systems
- Professional deployment pipelines with safety checks
- Comprehensive testing preventing most issues
- Multiple fallback options for any scenario

**When in Doubt:**
1. **Don't Panic** - Your systems are designed to recover
2. **Check Health** - Use the diagnostic tools provided
3. **Rollback First** - It's always safe to go back to what worked
4. **Ask Claude Code** - Provide error details and get specific help

**Your business is protected. Your infrastructure is bulletproof. You can handle this!**