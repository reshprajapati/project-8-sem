# 🔄 MongoDB to File-Based Database Migration Guide

## 📝 What Changed?

The project has been migrated from **MongoDB** to a **file-based database using Lowdb**. 

### Benefits of File-Based Storage:
✅ **No External Dependencies** - No MongoDB server needed  
✅ **Local Development** - Works offline without internet  
✅ **Easy Setup** - Delete files to reset, backup by copying folder  
✅ **Perfect for Learning** - Great for development & testing  
✅ **Same API** - Controllers work the same way  
✅ **Portable** - All data in `backend/db/data/` folder

---

## 🚀 Updated Setup Instructions

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

**New packages:**
- `lowdb` - File-based JSON database
- `uuid` - Generate unique IDs

### Step 2: Create Environment File
```bash
copy .env.example .env
```

### Step 3: NO MongoDB Configuration Needed! ✅
You're done! No database URL needed anymore.

---

## 📂 Database File Structure

All data is stored in local JSON files:

```
backend/
├── db/
│   ├── data/
│   │   ├── users.json          # All user accounts
│   │   ├── appointments.json   # All appointments
│   │   └── designs.json        # All design projects
│   ├── init.js                 # Database initialization
│   ├── User.js                 # User model (file-based)
│   ├── Appointment.js          # Appointment model
│   └── Design.js               # Design model
```

### Example File Structure:

**users.json:**
```json
{
  "users": [
    {
      "_id": "uuid-here",
      "name": "John Designer",
      "email": "john@example.com",
      "password": "hashed-password",
      "role": "designer",
      "createdAt": "2024-04-23T10:00:00.000Z",
      ...
    }
  ]
}
```

---

## 🔧 Developer Features

### Reset Database
Simply delete files to start fresh:
```bash
# Delete all data
del backend\db\data\*.json

# Or individual tables
del backend\db\data\users.json
```

### Backup Database
```bash
# Copy the entire db/data folder
xcopy backend\db\data backup\data /E /I
```

### View/Edit Database Directly
Open `backend/db/data/users.json` in any text editor to view/edit data directly!

---

## ⚙️ API Changes

**✅ No changes to API endpoints!**

All routes work exactly the same:
- `POST /api/auth/register`
- `POST /api/auth/login`  
- `GET /api/appointments`
- `POST /api/appointments`
- `GET /api/designs`
- `POST /api/designs`
- And all others...

Frontend code doesn't need any changes!

---

## 📊 Performance Notes

**Suitable for:**
- ✅ Development
- ✅ Testing
- ✅ Learning
- ✅ Small projects (< 10,000 records)
- ✅ Offline development

**Not recommended for:**
- ❌ Production with millions of records
- ❌ High-frequency concurrent writes
- ❌ Multi-server deployments

---

## 🔍 Debugging

### View All Users
Edit `backend/db/data/users.json` to see all user accounts

### Clear All Data
Delete all files in `backend/db/data/` to reset the database

### Data Persistence
Data is saved automatically when API calls create/update records

---

## 🧪 Testing

### Create Test Data
```bash
# Register a user
POST http://localhost:5000/api/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test123",
  "confirmPassword": "Test123",
  "role": "user"
}
```

### Check Saved Data
Open `backend/db/data/users.json` - The new user should appear there!

---

## 🚨 Important Notes

1. **No Mongoose** - The `models/` folder is no longer used
2. **New Models** - Use models from `db/` folder instead
3. **IDs are UUIDs** - Not MongoDB ObjectIds
4. **No Validation** - Add validation in routes if needed
5. **No Indexes** - All searches are linear (fine for development)

---

## 📡 Migration from MongoDB (if you have old data)

To use existing MongoDB data:
1. Export MongoDB collections as JSON
2. Convert to the new format
3. Place JSON files in `backend/db/data/`

Contact support if you need help with this.

---

## 🎯 Next Steps

1. ✅ Run `npm install` in backend
2. ✅ Copy `.env.example` to `.env`
3. ✅ Run `npm run dev` for backend
4. ✅ Run `npm start` for frontend (no changes)
5. ✅ Test the app normally!

---

## ❓ FAQ

**Q: Can I use this in production?**
A: Not recommended for large-scale production. Consider MongoDB or PostgreSQL for production.

**Q: Will my data be lost if I restart the server?**
A: No! Data is saved in JSON files and persists across server restarts.

**Q: Can I edit JSON files directly?**
A: Yes! Edit any file in `backend/db/data/` and changes take effect immediately.

**Q: How do I backup my data?**
A: Copy the entire `backend/db/data/` folder to another location.

**Q: Can multiple instances access the same database?**
A: Not safely. File-based DBs don't support concurrent writes well. Use MongoDB for that.

---

## 🆘 Troubleshooting

### Error: "Cannot read property 'users' of undefined"
**Solution:** Make sure `npm install` was run and `initDB()` is called in server.js

### Error: "File not found"
**Solution:** Files are created automatically on first write. Restart server if issue persists.

### Data not saving
**Solution:** Check that `await db.users.write()` is called after updates in models

---

## 📚 Learn More

- [Lowdb Documentation](https://github.com/typicode/lowdb)
- [JSON File Format](https://www.json.org/)
- [UUID Standard](https://tools.ietf.org/html/rfc4122)

---

**Happy Developing! 🎉**
