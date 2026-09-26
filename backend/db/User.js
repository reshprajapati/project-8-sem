const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const BaseModel = require('./BaseModel');

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

class UserModel extends BaseModel {
  constructor() {
    super('users');
  }

  async create(userData) {
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
      availability: normalizeAvailability(userData.availability)
    };

    if (user.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }

    const created = await super.create(user);
    return hydrateUser(created);
  }

  async findOne(query) {
    const user = await super.findOne(query);
    return hydrateUser(user);
  }

  async findById(id) {
    const user = await super.findById(id);
    return hydrateUser(user);
  }

  async find(query = {}) {
    const users = await super.find(query);
    return users.map(hydrateUser);
  }

  async findByIdAndUpdate(id, updates) {
    const nextUpdates = { ...updates };

    if (Object.prototype.hasOwnProperty.call(nextUpdates, 'availability')) {
      nextUpdates.availability = normalizeAvailability(nextUpdates.availability);
    }

    const user = await super.findByIdAndUpdate(id, nextUpdates);
    return hydrateUser(user);
  }

  async findByIdAndDelete(id) {
    const user = await super.findByIdAndDelete(id);
    return hydrateUser(user);
  }

  async updateOne(query, updates) {
    const user = await super.findOne(query);
    if (!user) return null;
    return this.findByIdAndUpdate(user._id, updates);
  }

  select(fields) {
    return this;
  }
}

module.exports = new UserModel();
