/**
 * Storage adapter backed by MongoDB via Mongoose.
 *
 * Two deliberate choices keep this a drop-in swap for the file adapter:
 *
 *  - `_id` is a String, not an ObjectId, so the uuids the models already
 *    generate stay valid and every existing relationship survives migration.
 *  - Schemas are non-strict, so the documents keep exactly the shape the
 *    controllers already build. Validation stays where it always was: in the
 *    controllers.
 */
const mongoose = require('mongoose');
const { COLLECTIONS } = require('../collections');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/interior_design';

const models = {};

const buildModel = (name) => {
  const schema = new mongoose.Schema(
    { _id: { type: String } },
    {
      strict: false,     // documents keep the shape the controllers build
      versionKey: false, // no __v leaking into API responses
      minimize: false    // keep empty objects such as address: {}
    }
  );

  // Third argument pins the collection name to the JSON file name, so the
  // two drivers describe the same data.
  return mongoose.model(name, schema, name);
};

const mongoAdapter = {
  name: 'mongo',

  describe() {
    return `MongoDB (${process.env.MONGODB_URI || DEFAULT_URI})`;
  },

  async init() {
    const uri = process.env.MONGODB_URI || DEFAULT_URI;

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

    COLLECTIONS.forEach(name => {
      models[name] = mongoose.models[name] || buildModel(name);
    });

    return models;
  },

  async create(name, record) {
    const created = await models[name].create(record);
    return created.toObject();
  },

  async find(name, query = {}) {
    return models[name].find(query).lean();
  },

  async findOne(name, query) {
    return models[name].findOne(query).lean();
  },

  async findById(name, id) {
    return models[name].findById(id).lean();
  },

  async findByIdAndUpdate(name, id, updates) {
    // returnDocument 'after' gives the updated document, matching the file adapter.
    return models[name].findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' }).lean();
  },

  async findByIdAndDelete(name, id) {
    return models[name].findByIdAndDelete(id).lean();
  }
};

module.exports = mongoAdapter;
