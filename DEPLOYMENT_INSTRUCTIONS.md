# ShopStation Deployment Guide

## Backend Deployment to Railway

### Step 1: Railway Setup
1. Open terminal and navigate to the backend folder:
   ```bash
   cd /Users/gavrielsacks/grocery-compare-app/backend
   ```

2. Login to Railway (this will open your browser):
   ```bash
   railway login
   ```

3. Initialize Railway project:
   ```bash
   railway init
   ```
   - Choose "Create new project"
   - Name it "shopstation-backend" or similar

4. Set environment variables:
   ```bash
   railway add ADMIN_PASSWORD
   # Enter a secure password when prompted
   
   railway add NODE_ENV production
   ```

5. Deploy:
   ```bash
   railway up
   ```

6. Get your Railway backend URL:
   ```bash
   railway status
   ```
   Copy the URL (it will be something like `https://shopstation-backend-production-xxxx.up.railway.app`)

## Frontend Deployment to Vercel

### Step 1: Vercel CLI Setup
1. Install Vercel CLI if not installed:
   ```bash
   npm install -g vercel
   ```

2. Navigate to frontend folder:
   ```bash
   cd /Users/gavrielsacks/grocery-compare-app/frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

### Step 2: Deploy Frontend
1. Set the environment variable for your backend URL:
   ```bash
   vercel env add REACT_APP_API_URL
   ```
   Enter the Railway backend URL you copied earlier

2. Deploy:
   ```bash
   vercel --prod
   ```

### Step 3: Alternative - Deploy via Web Interface

**For Railway:**
1. Go to https://railway.app/new
2. Connect your GitHub account
3. Select "Deploy from GitHub repo"
4. Choose your repository and select the `backend` folder
5. Set environment variables in Railway dashboard:
   - `ADMIN_PASSWORD`: Your secure admin password
   - `NODE_ENV`: production

**For Vercel:**
1. Go to https://vercel.com/new
2. Import your repository
3. Set root directory to `frontend`
4. Add environment variable:
   - `REACT_APP_API_URL`: Your Railway backend URL
5. Deploy

## Post-Deployment Checklist

### Backend Verification
- [ ] Test health endpoint: `GET https://your-railway-url.up.railway.app/api/health`
- [ ] Test inventory endpoint with admin password
- [ ] Verify automatic backups are working

### Frontend Verification
- [ ] Visit your Vercel URL
- [ ] Test shopping list analyzer
- [ ] Test admin panel with your admin password
- [ ] Verify all API calls are working

### Update API URLs
- [ ] Update the default Railway URL in all frontend components if your URL is different
- [ ] Test all functionality end-to-end

## Troubleshooting

### Common Issues
1. **CORS errors**: Ensure your Railway backend allows your Vercel frontend domain
2. **Environment variables**: Double-check all env vars are set correctly
3. **Build failures**: Check logs in Railway/Vercel dashboards
4. **Admin password**: Make sure it matches between frontend requests and backend auth

### Health Checks
- Backend health: `https://your-railway-url/api/health`
- Frontend: Should load the main page with ShopStation branding

## Security Notes
- Use a strong ADMIN_PASSWORD
- Never commit actual credentials to git
- Regularly update dependencies