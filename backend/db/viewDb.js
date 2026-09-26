/**
 * Dev utility: print the active database as readable tables.
 * Reads through the model layer, so it follows DB_DRIVER.
 *
 *   npm run db:view                     all collections
 *   node db/viewDb.js users             one collection
 *   DB_DRIVER=mongo npm run db:view     read MongoDB instead of the JSON files
 */
require('dotenv').config();

const { initDB } = require('./init');
const User = require('./User');
const Design = require('./Design');
const Appointment = require('./Appointment');
const Project = require('./Project');
const CoverageRequest = require('./CoverageRequest');

const shorten = (value, max = 28) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const when = (value) => (value ? new Date(value).toLocaleString() : '');

const nameOf = (id, users) => {
  if (!id) return '— none';
  return users.find(u => u._id === id)?.name || `⚠ ${shorten(id, 8)}`;
};

const views = {
  users: {
    load: () => User.find(),
    row: (u) => ({
      name: u.name,
      email: u.email,
      role: u.role,
      openSlots: (u.availability || []).length,
      specialization: shorten(u.specialization, 18)
    })
  },
  designs: {
    load: () => Design.find(),
    row: (d, users) => ({
      title: shorten(d.title, 30),
      designer: nameOf(d.designerId, users),
      category: d.category,
      reviews: (d.reviews || []).length
    })
  },
  appointments: {
    load: () => Appointment.find(),
    row: (a, users) => ({
      client: nameOf(a.userId, users),
      designer: nameOf(a.designerId, users),
      time: when(a.appointmentTime),
      status: a.status,
      area: a.surfaceArea,
      budget: a.budget
    })
  },
  projects: {
    load: () => Project.find(),
    row: (p, users) => ({
      title: shorten(p.title, 24),
      client: nameOf(p.clientId, users),
      designer: nameOf(p.designerId, users),
      status: p.status,
      steps: (p.history || []).length
    })
  },
  coverageRequests: {
    load: () => CoverageRequest.find(),
    row: (r, users) => ({
      client: nameOf(r.userId, users),
      wanted: nameOf(r.requestedDesignerId, users),
      date: when(r.requestedDate),
      status: r.status,
      assigned: nameOf(r.assignedDesignerId, users)
    })
  }
};

(async () => {
  await initDB();

  const users = await User.find();
  const only = process.argv[2];
  const names = only ? [only] : Object.keys(views);

  for (const name of names) {
    if (!views[name]) {
      console.log(`Unknown collection "${name}". Try: ${Object.keys(views).join(', ')}`);
      continue;
    }

    const records = await views[name].load();
    console.log(`\n=== ${name.toUpperCase()} (${records.length}) ===`);

    if (records.length === 0) {
      console.log('(empty)');
    } else {
      console.table(records.map(record => views[name].row(record, users)));
    }
  }

  console.log('\n⚠ marks an id with no matching user.');
  process.exit(0);
})().catch(err => {
  console.error(`Failed: ${err.message}`);
  process.exit(1);
});
