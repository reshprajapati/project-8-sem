/**
 * Chooses the storage driver and exposes it to the models.
 *
 *   DB_DRIVER=file   (default) JSON files in db/data/ - no server needed
 *   DB_DRIVER=mongo            MongoDB via Mongoose
 *
 * Both adapters implement the same interface, so nothing above this file
 * changes when the driver changes.
 */
const fileAdapter = require('./adapters/fileAdapter');
const mongoAdapter = require('./adapters/mongoAdapter');

const ADAPTERS = {
  file: fileAdapter,
  mongo: mongoAdapter
};

let adapter = null;

const selectAdapter = () => {
  const driver = (process.env.DB_DRIVER || 'file').toLowerCase();

  if (!ADAPTERS[driver]) {
    throw new Error(
      `Unknown DB_DRIVER "${driver}". Use one of: ${Object.keys(ADAPTERS).join(', ')}`
    );
  }

  return ADAPTERS[driver];
};

async function initDB() {
  adapter = selectAdapter();

  try {
    await adapter.init();
  } catch (err) {
    if (adapter.name === 'mongo') {
      throw new Error(
        `Could not connect to MongoDB: ${err.message}\n` +
        '   Check that the MongoDB service is running, or set DB_DRIVER=file to use the JSON store.'
      );
    }
    throw err;
  }

  console.log(`✅ Connected to ${adapter.describe()}`);
  return adapter;
}

const getAdapter = () => {
  if (!adapter) {
    throw new Error('Database not initialised. Call initDB() before using any model.');
  }
  return adapter;
};

module.exports = { initDB, getAdapter };
