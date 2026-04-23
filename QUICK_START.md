# 🎨 Interior Design Appointment & Portfolio System - MERN Stack

A professional, full-featured web application built with React, Node.js, Express, and MongoDB.

## ⚡ Quick Start (Windows PowerShell)

### Step 1: Backend Setup & Installation
```powershell
# Open Terminal 1
cd backend
npm install
npm run dev
```

**Expected Output:**
```
✅ File-based database initialized successfully
🚀 Server running on http://localhost:5000
📌 Environment: development
```

### Step 2: Frontend Setup & Installation (New Terminal)
```powershell
# Open Terminal 2 (keep Terminal 1 running!)
cd frontend
npm install
npm start
```

**Expected Output:**
Opens browser automatically at: **http://localhost:3000**

### Step 3: Create Test Accounts
1. Click "Get Started" on homepage
2. Register as **User (Client)** and **Designer**
3. Login and explore!

---

## 📋 What's Included

### ✨ User Features
- 📅 Book appointments with designers
- 📸 Browse designer portfolios
- 👥 View designer profiles & specializations
- 💬 Check appointment status
- 🎨 See design projects

### 🎨 Designer Features  
- 📊 Manage client appointments
- 🖼️ Upload and showcase designs
- ⏰ Set field visit times
- ⭐ Receive client reviews
- 📈 Build design portfolio

### 🔐 Core Features
- JWT authentication
- Role-based access (User/Designer)
- Secure password hashing
- Responsive mobile design
- Appointment scheduling
- Design portfolio system

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js, Express.js |
| Database | Lowdb (File-based JSON) |
| Frontend | React |
| Styling | CSS3 |
| Authentication | JWT |
| API | RESTful |
| State Mgmt | React Hooks |

---

## 📁 Project Structure

```
project/
├── backend/              # Express server
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth & errors
│   ├── server.js
│   └── .env.example
│
├── frontend/            # React app
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # UI components
│   │   ├── services/   # API client
│   │   └── App.js
│   └── public/
│
├── README.md           # Main documentation
└── SETUP_GUIDE.md      # Detailed setup help
```

---

## 🚀 Running Steps

### Prerequisites
- ✅ Node.js v18+
- ✅ npm/yarn
- ✅ **No MongoDB needed!** (Uses file-based database)

### Full Setup

1. **Get MongoDB URL**
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Local: Already running `mongod`
   - Copy connection string

2. **Backend Configuration**
   ```bash
   cd backend
   npm install
   copy .env.example .env
   ```
   
   `backend/.env` is pre-configured for file-based database (no MongoDB needed!)

3. **Start Backend (Terminal 1)**
   ```bash
   cd backend
   npm run dev
   ✅ Running on http://localhost:5000
   ```

4. **Frontend Configuration**
   ```bash
   cd frontend
   npm install
   copy .env.example .env
   ```
   
   `frontend/.env` is already configured correctly (no changes needed initially)

5. **Start Frontend (Terminal 2)**
   ```bash
   cd frontend
   npm start
   ✅ Opens at http://localhost:3000
   ```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

---

## 📝 Test Accounts

Use these to test the application:

**Client:**
- Email: `client@test.com`
- Password: `Test@123`
- Role: User

**Designer:**
- Email: `designer@test.com`
- Password: `Test@123`
- Role: Designer

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Appointments
```
GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id
PUT    /api/appointments/:id/set-visit-time
```

### Designs/Portfolio
```
GET    /api/designs
POST   /api/designs
PUT    /api/designs/:id
DELETE /api/designs/:id
```

### Users
```
GET    /api/users/designers
GET    /api/users/:id
PUT    /api/users/profile/update
```

---

## ⚙️ Environment Variables

### Backend (backend/.env)
```env
PORT=5000
JWT_SECRET=your_secret_key_minimum_32_chars_recommended
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# File-based database - stores data in backend/db/data/ folder
# No MongoDB configuration needed!
```

### Frontend (frontend/.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Check if MongoDB is running
# For Atlas: Verify IP whitelist allows 0.0.0.0/0
# For Local: mongod must be running
```

### Port Already in Use (5000 or 3000)
```powershell
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### CORS Error
- Check `CORS_ORIGIN` in backend/.env
- Verify `REACT_APP_API_URL` in frontend/.env
- Restart both servers

### Dependencies Issues
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

---

## 📚 Detailed Documentation

For comprehensive setup and troubleshooting, see: **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**

---

## 💡 Key Features Explained

### Appointment System
- Users request appointments with designers
- Designers confirm and set field visit times
- Track appointment status (pending, confirmed, completed)

### Design Portfolio
- Designers showcase their work
- Users browse portfolio by category
- Client reviews and ratings
- Before/after comparisons

### Designer Profiles
- Specialization and experience
- Contact information & social links
- Portfolio display
- Search and filter designers

---

## 📱 Responsive Design

✅ Works on:
- Desktop (1920x1080+)
- Tablet (768px+)
- Mobile (320px+)

---

## 🎯 Next Steps

1. ✅ Backend running at :5000
2. ✅ Frontend running at :3000
3. ✅ MongoDB connected
4. 📝 Create first design/appointment
5. 🚀 Deploy to production

---

## 📞 Support

- Check `backend/` and `frontend/` terminal logs
- Review errors in browser DevTools (F12)
- See SETUP_GUIDE.md for detailed troubleshooting

---

## 🎨 Happy Designing!

Your professional interior design system is ready to use! 🚀

**Questions?** → Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) or review the code comments.
