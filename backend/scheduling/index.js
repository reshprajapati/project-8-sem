/**
 * Scheduling module — the domain algorithms of this project.
 *
 *   slots.js      normalisation and the reserve/release slot lifecycle
 *   conflicts.js  double-booking guards
 *   calendar.js   per-day aggregation and first-fit slot allocation
 *   matching.js   load-balanced designer matching (filter, then score)
 *
 * Depends on `algorithms/` for the generic primitives — sorting, linear and
 * binary search, hash lookups — and adds the scheduling logic on top. The
 * dependency only runs one way: `algorithms/` knows nothing about scheduling.
 *
 * Every function is pure. Where a function needs a domain rule — "which
 * bookings occupy their slot?" — it takes that rule as an injected predicate
 * rather than hard-coding it, which is what keeps this module testable without
 * a database.
 *
 * Run `npm run sched:demo` to see each algorithm execute against sample data.
 */
const slots = require('./slots');
const conflicts = require('./conflicts');
const calendar = require('./calendar');
const matching = require('./matching');

module.exports = {
  ...slots,
  ...conflicts,
  ...calendar,
  ...matching,
  slots,
  conflicts,
  calendar,
  matching
};
