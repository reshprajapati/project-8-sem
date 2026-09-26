/**
 * Copies every record from the JSON store into MongoDB.
 *
 *   node db/migrateToMongo.js           insert records MongoDB does not have yet
 *   node db/migrateToMongo.js --fresh   wipe the collections first, then import
 *
 * Runs independently of DB_DRIVER: it always reads files and always writes
 * to Mongo, so it works no matter which driver the server is set to.
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const { COLLECTIONS } = require('./collections');
const mongoAdapter = require('./adapters/mongoAdapter');

const fresh = process.argv.includes('--fresh');
const dataDir = path.join(__dirname, 'data');

const readCollection = (name) => {
  const file = path.join(dataDir, `${name}.json`);
  if (!fs.existsSync(file)) return [];

  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(parsed[name]) ? parsed[name] : [];
};

(async () => {
  try {
    await mongoAdapter.init();
    console.log(`Connected to ${mongoAdapter.describe()}`);
    if (fresh) console.log('Mode: --fresh (existing collections will be dropped)\n');
    else console.log('Mode: incremental (existing _ids are skipped)\n');

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const name of COLLECTIONS) {
      const collection = mongoose.connection.collection(name);
      const records = readCollection(name);

      if (fresh) {
        await collection.deleteMany({});
      }

      if (records.length === 0) {
        console.log(`${name.padEnd(18)} 0 records in JSON - nothing to do`);
        continue;
      }

      const existingIds = new Set(
        (await collection.find({}, { projection: { _id: 1 } }).toArray()).map(doc => doc._id)
      );

      const toInsert = records.filter(record => !existingIds.has(record._id));
      const skipped = records.length - toInsert.length;

      if (toInsert.length > 0) {
        await collection.insertMany(toInsert, { ordered: false });
      }

      totalInserted += toInsert.length;
      totalSkipped += skipped;

      console.log(
        `${name.padEnd(18)} inserted ${String(toInsert.length).padStart(3)}` +
        (skipped > 0 ? `, skipped ${skipped} already present` : '')
      );
    }

    console.log(`\n✅ Migration complete - ${totalInserted} inserted, ${totalSkipped} skipped.`);
    console.log('   Set DB_DRIVER=mongo in backend/.env, then restart the server.');
  } catch (err) {
    console.error(`\n❌ Migration failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
