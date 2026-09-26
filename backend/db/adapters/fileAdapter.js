/**
 * Storage adapter backed by Lowdb — one JSON file per collection in db/data/.
 * Requires no database server, which is why it stays the default.
 */
const { Low, JSONFile } = require('lowdb');
const path = require('path');
const { COLLECTIONS } = require('../collections');
const { linearFindBy, findById, findIndexById } = require('../../algorithms');

const dbDir = path.join(__dirname, '..', 'data');

const db = {};

const collectionOf = (name) => db[name].data?.[name] || [];

const write = (name) => db[name].write();

const matches = (item, query) => {
  return Object.keys(query).every(key => item[key] === query[key]);
};

const fileAdapter = {
  name: 'file',

  describe() {
    return `file-based database (${dbDir})`;
  },

  async init() {
    for (const name of COLLECTIONS) {
      const adapter = new JSONFile(path.join(dbDir, `${name}.json`));
      db[name] = new Low(adapter);
      await db[name].read();
      db[name].data ||= { [name]: [] };
    }

    return db;
  },

  async create(name, record) {
    collectionOf(name).push(record);
    await write(name);
    return record;
  },

  async find(name, query = {}) {
    const items = collectionOf(name);
    if (Object.keys(query).length === 0) {
      return [...items];
    }
    return items.filter(item => matches(item, query));
  },

  async findOne(name, query) {
    return linearFindBy(collectionOf(name), item => matches(item, query));
  },

  async findById(name, id) {
    return findById(collectionOf(name), id);
  },

  async findByIdAndUpdate(name, id, updates) {
    const items = collectionOf(name);
    const index = findIndexById(items, id);
    if (index === -1) return null;

    const updated = { ...items[index], ...updates };
    items[index] = updated;
    await write(name);
    return updated;
  },

  async findByIdAndDelete(name, id) {
    const items = collectionOf(name);
    const index = findIndexById(items, id);
    if (index === -1) return null;

    const [deleted] = items.splice(index, 1);
    await write(name);
    return deleted;
  }
};

module.exports = fileAdapter;
