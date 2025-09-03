# Quick Deploy Commands

## Backend to Railway (run these commands in terminal)

```bash
# Navigate to backend
cd /Users/gavrielsacks/grocery-compare-app/backend

# Initialize Railway project
railway init
# Choose: Create new project
# Name it: shopstation-backend

# Set environment variables
railway add ADMIN_PASSWORD
# Enter: temp-password-123 (or your preferred secure password)

railway add NODE_ENV production

# Deploy
railway up

# Get your URL
railway status
```

## Frontend to Vercel

```bash
# Navigate to frontend
cd /Users/gavrielsacks/grocery-compare-app/frontend

# Check if logged in to Vercel
vercel whoami

# If not logged in, run:
vercel login

# Set environment variable (use your Railway URL from above)
vercel env add REACT_APP_API_URL
# Enter: production
# Enter your Railway URL: https://your-app-name.up.railway.app

# Deploy
vercel --prod
```

## Expected Results

After Railway deployment, you should get a URL like:
`https://shopstation-backend-production-xxxx.up.railway.app`

After Vercel deployment, you should get a URL like:
`https://your-app-name.vercel.app`

Test both services are working by visiting:
- Backend health: `https://your-railway-url/api/health`
- Frontend: `https://your-vercel-url`