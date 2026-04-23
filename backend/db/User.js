const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { db } = require('./init');

const normalizeAvailability = (availability = []) => {
  if (!Array.isArray(availability)) {
    return [];
  }

  return [...new Set(
    availability
      .map(slot => {
        const date = new Date(slot);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      })
      .filter(Boolean)
  )].sort((a, b) => new Date(a) - new Date(b));
};

const hydrateUser = (user) => {
  if (!user) {
    return null;
  }

  const hydratedUser = {
    bio: '',
    profileImage: null,
    specialization: '',
    experience: 0,
    address: {},
    socialLinks: {},
    availability: [],
    ...user,
    availability: normalizeAvailability(user.availability)
  };

  Object.defineProperty(hydratedUser, 'matchPassword', {
    enumerable: false,
    value: async function(enteredPassword) {
      return bcrypt.compare(enteredPassword, this.password);
    }
  });

  return hydratedUser;
};

// User Model
class UserModel {
  static async create(userData) {
    const user = {
      _id: uuidv4(),
      bio: '',
      profileImage: null,
      specialization: '',
      experience: 0,
      address: {},
      socialLinks: {},
      availability: [],
      ...userData,
      availability: normalizeAvailability(userData.availability),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Hash password
    if (user.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }

    db.users.data.users.push(user);
    await db.users.write();
    return hydrateUser(user);
  }

  static async findOne(query) {
    const user = db.users.data.users.find(user => {
      return Object.keys(query).every(key => user[key] === query[key]);
    });

    return hydrateUser(user);
  }

  static async findById(id) {
    const user = db.users.data.users.find(user => user._id === id);
    return hydrateUser(user);
  }

  static async find(query = {}) {
    if (Object.keys(query).length === 0) {
      return db.users.data.users.map(hydrateUser);
    }

    return db.users.data.users.filter(user => {
      return Object.keys(query).every(key => user[key] === query[key]);
    }).map(hydrateUser);
  }

  static async findByIdAndUpdate(id, updates) {
    const index = db.users.data.users.findIndex(user => user._id === id);
    if (index === -1) return null;
    const nextUpdates = { ...updates };

    if (Object.prototype.hasOwnProperty.call(nextUpdates, 'availability')) {
      nextUpdates.availability = normalizeAvailability(nextUpdates.availability);
    }

    const user = { ...db.users.data.users[index], ...nextUpdates, updatedAt: new Date() };
    db.users.data.users[index] = user;
    await db.users.write();
    return hydrateUser(user);
  }

  static async findByIdAndDelete(id) {
    const index = db.users.data.users.findIndex(user => user._id === id);
    if (index === -1) return null;
    const user = db.users.data.users[index];
    db.users.data.users.splice(index, 1);
    await db.users.write();
    return hydrateUser(user);
  }

  static async updateOne(query, updates) {
    const user = await this.findOne(query);
    if (!user) return null;
    return this.findByIdAndUpdate(user._id, updates);
  }

  static select(fields) {
    return this;
  }
}

module.exports = UserModel;
