/**
 * Algorithms module — generic sorting and searching primitives.
 *
 *   comparators.js  ordering rules (the part of "sorting" that is hand-written)
 *   sorting.js      sort operations built on those comparators
 *   searching.js    search operations, grouped by complexity class
 *
 * Nothing here knows anything about this project's domain — no slots, no
 * bookings, no designers. The domain algorithms that build on these live in
 * `scheduling/`, which depends on this module and not the other way round.
 *
 * Run `npm run algo:demo` to see each algorithm execute against sample data.
 */
const comparators = require('./comparators');
const sorting = require('./sorting');
const searching = require('./searching');

module.exports = {
  ...comparators,
  ...sorting,
  ...searching,
  comparators,
  sorting,
  searching
};
