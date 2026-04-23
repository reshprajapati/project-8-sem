# 🚀 Setup & Running Guide - Interior Design System

Complete step-by-step instructions to set up and run the Interior Design Appointment & Portfolio System.

## Prerequisites

Before getting started, ensure you have:
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **MongoDB** (Cloud Atlas or Local)
- **Git** (for version control)
- A code editor (VS Code recommended)

## Quick Start (5 minutes)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env

# ⚠️ IMPORTANT: Edit .env with your MongoDB URL
# Edit backend/.env and update:
# - MONGODB_URL: your MongoDB connection string
# - JWT_SECRET: set to a secure random string (min 32 chars)
# - PORT: 5000
# - NODE_ENV: development

# Start backend server
npm run dev
```

Expected output:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
📌 Environment: development
```

### 2. Frontend Setup (in a new terminal)

Keep backend running in the first terminal!

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Start frontend
npm start
```

The app will automatically open at **http://localhost:3000**

## MongoDB Setup

### Option A: MongoDB Atlas (Cloud - Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new project and cluster
4. Get connection string (Username/Password)
5. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/interior-design`
6. Paste into backend `.env` as `MONGODB_URL`

### Option B: Local MongoDB

```bash
# Install MongoDB Community Edition from:
# https://docs.mongodb.com/manual/installation/

# On Windows (if installed):
# MongoDB runs as a service automatically

# Or start MongoDB manually:
# Open PowerShell as Admin
mongod
```

Connection string: `mongodb://localhost:27017/interior-design`

## Environment Variables

### Backend `.env` (backend/.env)

```env
PORT=5000
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/interior-design?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_at_least_32_characters_long_for_security_purposes
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Important:**
- `JWT_SECRET`: Use a strong random string (copy: `generateSecureRandomString123456789abc`)
- `MONGODB_URL`: Replace with your actual MongoDB connection string
- `CORS_ORIGIN`: Keep as `http://localhost:3000` for development

### Frontend `.env` (frontend/.env)

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Test the Application

### 1. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

### 2. Create Test Accounts

**Test User (Client):**
```
Email: client@example.com
Password: Test123
Role: User
```

**Test Designer:**
```
Email: designer@example.com  
Password: Test123
Role: Designer
```

### 3. Test Key Features

1. **Register & Login**
   - Go to home page
   - Click "Get Started"
   - Create new account
   - Log in

2. **Browse Designers** (as User)
   - Go to Dashboard
   - View featured designers
   - Click "View Profile" to see designer details

3. **View Portfolio**
   - Click "Portfolio" in navigation
   - Filter by category
   - Click on designs to see details

4. **Manage Appointments** (as User)
   - Click "Appointments"
   - View any existing appointments

5. **Designer Dashboard** (as Designer)
   - Log in as designer
   - See design portfolio on dashboard

## Common Issues & Solutions

### Issue: MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:**
1. Check MongoDB URL in `.env`
2. Verify credentials are correct
3. For Atlas: Check IP whitelist (allow 0.0.0.0/0)
4. For Local: Start MongoDB service
5. Test connection: `node -e "require('mongoose').connect('YOUR_URL')"`

### Issue: Port Already in Use
```
Error: listen EADDRINUSE :::5000
```
**Solution:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use different port:
# Edit backend/.env and change PORT=5001
```

### Issue: CORS Error in Browser
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
1. Verify backend is running: `http://localhost:5000/api/health`
2. Check `CORS_ORIGIN` in backend `.env`
3. Check `REACT_APP_API_URL` in frontend `.env`

## Project Architecture

```
project/
├── backend/                 # Node.js + Express
│   ├── models/             # MongoDB schemas
│   ├── controllers/        # Business logic
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth, errors
│   ├── server.js           # Main server file
│   ├── package.json
│   └── .env                # Configuration
│
├── frontend/               # React
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API calls
│   │   ├── App.js         # Main app
│   │   └── index.js       # Entry point
│   ├── public/
│   ├── package.json
│   └── .env               # Configuration
│
└── README.md              # Project documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Appointments
- `GET /api/appointments` - Get user's appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PUT /api/appointments/:id/set-visit-time` - Set field visit time (Designer only)

### Designs
- `GET /api/designs` - Get portfolio designs
- `POST /api/designs` - Create design (Designer only)
- `GET /api/designs/:id` - Get design details
- `PUT /api/designs/:id` - Update design (Designer only)
- `DELETE /api/designs/:id` - Delete design (Designer only)

### Users
- `GET /api/users/designers` - Get all designers
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/profile/update` - Update profile
- `GET /api/users/search` - Search designers

## Development Workflow

### Terminal 1 - Backend
```bash
cd backend
npm run dev
# Stays running, watching for changes with nodemon
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start
# Auto-opens browser and hot-reloads on code changes
```

### Terminal 3 - (Optional) MongoDB Compass
View and manage database:
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect with your MongoDB URL
3. Explore collections in real-time

## Production Deployment

### Backend Deployment (Heroku Example)
```bash
cd backend
# Add Procfile:
# web: node server.js

heroku login
heroku create your-app-name
git push heroku main
```

### Frontend Deployment (Vercel Example)
```bash
cd frontend
npm run build
# Deploy 'build' folder to Vercel/Netlify
```

Update frontend `.env` to point to production backend URL

## Best Practices

1. **Never commit `.env`** - Add to `.gitignore`
2. **Use strong JWT_SECRET** - Minimum 32 characters
3. **CORS in production** - Specify exact domain, not *
4. **Database backups** - Regular backups for production
5. **Environment variables** - Different configs for dev/prod
6. **Error handling** - Check browser console and server logs

## Troubleshooting Checklist

- ✅ Node.js v18+ installed: `node --version`
- ✅ MongoDB connected: Check terminal logs
- ✅ Backend running: `http://localhost:5000/api/health`
- ✅ Frontend running: `http://localhost:3000`
- ✅ `.env` files created and filled
- ✅ Dependencies installed: `npm install`
- ✅ No port conflicts
- ✅ Firewall allows localhost connections

## Support & Documentation

- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [React Docs](https://react.dev/)
- [Mongoose ODM](https://mongoosejs.com/)

---

**Happy Designing! 🎨** If you face any issues, check the logs in both terminals for error messages.
