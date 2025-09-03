#!/bin/bash

# ShopStation Development Environment Setup
# This script sets up a new developer's environment automatically
# Run with: chmod +x scripts/setup-development.sh && ./scripts/setup-development.sh

set -e  # Exit on any error

echo "🚀 Setting up ShopStation development environment..."
echo "=============================================="

# Check if running on correct Node version
if ! node --version | grep -q "v1[6-9]\|v[2-9][0-9]"; then
    echo "❌ Node.js version 16+ required. Please install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version check passed"

# Create environment files if they don't exist
echo "📝 Setting up environment files..."

# Backend environment setup
if [ ! -f "backend/.env" ]; then
    echo "   Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    
    # Generate secure JWT secret
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Update the .env file with generated values
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS sed syntax
        sed -i '' "s/your-jwt-secret-key-here/$JWT_SECRET/" backend/.env
        sed -i '' "s/NODE_ENV=development/NODE_ENV=development/" backend/.env
    else
        # Linux sed syntax
        sed -i "s/your-jwt-secret-key-here/$JWT_SECRET/" backend/.env
        sed -i "s/NODE_ENV=development/NODE_ENV=development/" backend/.env
    fi
    
    echo "   ✅ Backend environment configured"
else
    echo "   ⚠️  Backend .env already exists, skipping..."
fi

# Frontend environment setup
if [ ! -f "frontend/.env" ]; then
    echo "   Creating frontend/.env from template..."
    cp frontend/.env.example frontend/.env
    echo "   ✅ Frontend environment configured"
else
    echo "   ⚠️  Frontend .env already exists, skipping..."
fi

# Install dependencies
echo "📦 Installing dependencies..."

echo "   Installing backend dependencies..."
cd backend
npm install --silent
cd ..

echo "   Installing frontend dependencies..."
cd frontend  
npm install --silent
cd ..

echo "✅ All dependencies installed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p backend/backups
echo "✅ Directories created"

# Test the setup
echo "🧪 Testing setup..."

# Test backend
echo "   Testing backend configuration..."
cd backend
if node -e "require('./config/environments.js'); console.log('Backend config OK')"; then
    echo "   ✅ Backend configuration valid"
else
    echo "   ❌ Backend configuration error"
    exit 1
fi
cd ..

# Test frontend
echo "   Testing frontend configuration..."
cd frontend
if node -e "require('./src/config/environments.js'); console.log('Frontend config OK')" 2>/dev/null; then
    echo "   ✅ Frontend configuration valid"
else
    echo "   ❌ Frontend configuration error"
    exit 1
fi
cd ..

echo ""
echo "🎉 Development environment setup complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Start the backend:  cd backend && npm start"
echo "2. Start the frontend: cd frontend && npm start"
echo "3. Open http://localhost:3000 to see the app"
echo "4. Access admin panel at http://localhost:3000/admin"
echo ""
echo "Need help? Check the documentation or ask a team member!"
echo ""