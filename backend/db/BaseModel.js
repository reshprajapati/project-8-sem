const { getAdapter } = require('./init');

/**
 * Mongoose-shaped data-access layer. Models extend this and never touch the
 * storage driver directly, so switching between the JSON store and MongoDB
 * is a configuration change rather than a code change.
 */
class BaseModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  // Resolved per call: models are constructed at require time, before initDB runs.
  get adapter() {
    return getAdapter();
  }

  async create(record) {
    const item = { ...record, createdAt: new Date(), updatedAt: new Date() };
    return this.adapter.create(this.collectionName, item);
  }

  async find(query = {}) {
    return this.adapter.find(this.collectionName, query);
  }

  async findOne(query) {
    return this.adapter.findOne(this.collectionName, query);
  }

  async findById(id) {
    return this.adapter.findById(this.collectionName, id);
  }

  async findByIdAndUpdate(id, updates) {
    return this.adapter.findByIdAndUpdate(this.collectionName, id, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async findByIdAndDelete(id) {
    return this.adapter.findByIdAndDelete(this.collectionName, id);
  }

  async updateOne(query, updates) {
    const item = await this.findOne(query);
    if (!item) return null;
    return this.findByIdAndUpdate(item._id, updates);
  }
}

module.exports = BaseModel;
