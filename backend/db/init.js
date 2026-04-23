const { Low, JSONFile } = require('lowdb');
const path = require('path');

// Database file paths
const dbDir = path.join(__dirname, 'data');
const dbPaths = {
  users: path.join(dbDir, 'users.json'),
  appointments: path.join(dbDir, 'appointments.json'),
  designs: path.join(dbDir, 'designs.json')
};

let db = {};

// Initialize database
async function initDB() {
  try {
    // Create users DB
    const usersAdapter = new JSONFile(dbPaths.users);
    db.users = new Low(usersAdapter);
    await db.users.read();
    db.users.data ||= { users: [] };

    // Create appointments DB
    const appointmentsAdapter = new JSONFile(dbPaths.appointments);
    db.appointments = new Low(appointmentsAdapter);
    await db.appointments.read();
    db.appointments.data ||= { appointments: [] };

    // Create designs DB
    const designsAdapter = new JSONFile(dbPaths.designs);
    db.designs = new Low(designsAdapter);
    await db.designs.read();
    db.designs.data ||= { designs: [] };

    console.log('✅ File-based database initialized successfully');
    return db;
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  }
}

module.exports = { initDB, db };
