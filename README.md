# Interior Design Appointment & Portfolio System

A professional MERN stack web application designed for interior designers and clients to seamlessly manage appointments, showcase design portfolios, and share design projects.

## 🎨 Features

### For Users (Clients)
- **Book Appointments**: Schedule design consultations with preferred time slots
- **Add Location Details**: Specify the spaces where design services are needed
- **View Designer Portfolio**: Browse completed design projects
- **Track Appointments**: Monitor upcoming and past appointments

### For Designers
- **See Your Schedule**: Booking dates are opened for you by the studio admin
- **Manage Appointments**: View and confirm appointment requests
- **Set Field Visit Times**: Schedule site visits for measurements and consultations
- **Upload Designs**: Share design mockups for specific surfaces/rooms
- **Portfolio Showcase**: Display completed projects to attract clients
- **Design Management**: Organize and categorize design projects

### For the Studio Admin
- **Own Every Calendar**: Open and close booking dates for each designer
- **Add Designers**: Create designer accounts from the console
- **Cover Packed Dates**: When a client wants a day a designer cannot take, appoint another designer who is free
- **Full Visibility**: Every appointment in the studio in one table

## 🗓️ Scheduling Workflow

The admin owns scheduling. Designers only read what the admin opens for them.

1. The admin opens booking dates on a designer's calendar.
2. A client picks an open time and books it directly. No admin involvement.
3. When every time on a date is taken, that date shows as **Packed** on the
   designer's public calendar.
4. A client can still pick a packed date. Instead of a booking, it creates a
   **coverage request** in the admin queue.
5. The admin opens the request, sees which designers are free that day ranked by
   who is least loaded, and appoints one. That creates the appointment on the
   substitute's calendar and records who it is covering for.

### Creating the admin account

Admins cannot be registered through the public signup form. Seed the first one:

```bash
cd backend
npm run seed:admin
```

Credentials come from `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_NAME` in `.env`.
They default to `admin@studio.local` / `admin123` for local development, so
change them before deploying.

## 🏗️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Lowdb** - File-based JSON database (✨ **No MongoDB needed!**)
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Dotenv** - Environment configuration

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling (Responsive design)

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn package manager
- **✅ NO MongoDB needed!** (Uses file-based Lowdb)

### Installation

#### 1. Clone and Navigate
```bash
cd project
```

#### 2. Backend Setup
```bash
cd backend
npm install
copy .env.example .env
```

**Note:** The `.env` file is pre-configured for file-based database. All data saves to `backend/db/data/` folder automatically!

Start the backend server:
```bash
npm run dev
```

Server runs on: **http://localhost:5000**

#### 3. Frontend Setup (in a new terminal)
```bash
cd frontend
npm install
npm start
```

Application runs on: **http://localhost:3000**

## 📁 Project Structure

```
project/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Appointment.js
│   │   ├── Design.js
│   │   └── Portfolio.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── appointments.js
│   │   ├── designs.js
│   │   └── users.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── designController.js
│   │   └── userController.js
│   ├── config/
│   │   └── database.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   ├── Appointments/
│   │   │   ├── Portfolio/
│   │   │   ├── Design/
│   │   │   └── Common/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🔑 Key Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Appointments
- `GET /api/appointments` - Get all appointments (user/designer)
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Designs
- `GET /api/designs` - Get all designs
- `POST /api/designs` - Upload new design
- `PUT /api/designs/:id` - Update design
- `DELETE /api/designs/:id` - Delete design

### Portfolio
- `GET /api/portfolio` - Get portfolio items
- `GET /api/portfolio/:designerId` - Get designer's portfolio
- `POST /api/portfolio` - Add to portfolio

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/designer/:id` - Get designer details

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:
- Tokens are stored in HTTP-only cookies
- Auto-logout on token expiration
- Role-based access control (User/Designer)

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# File-based database - all data saved in backend/db/data/ folder
# No MongoDB configuration required!
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

**That's it!** No database connection needed.

## 🛠️ Development

### Running in Development Mode
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

### Building for Production
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## 📚 API Documentation

Detailed API documentation is available in `backend/API_DOCS.md`

## 🐛 Troubleshooting

### Database File Not Created
- Check that `backend/db/data/` folder exists
- Run backend server to auto-create `.json` files
- Files are created on first write operation

### Port Already in Use
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### CORS Error
- Check `CORS_ORIGIN` in backend .env
- Verify frontend URL matches CORS_ORIGIN
- Restart both servers

### Data Not Saving
- Ensure `backend/db/data/` folder exists
- Check file permissions on the `db/data/` folder
- Restart backend server

### Reset Database
```bash
# Delete all data files to start fresh
del backend\db\data\*.json
# Restart server to recreate fresh files
```

## 🤝 Contributing

1. Create a feature branch
2. Commit changes
3. Push to branch
4. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues or questions, please create an issue in the repository.

---

**Happy Designing! 🎨**
