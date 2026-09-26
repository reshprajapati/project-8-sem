/**
 * Calendar aggregation and slot allocation.
 *
 * Turns two flat arrays — open slots and bookings — into a per-day view the
 * admin console can reason about, and picks a slot out of it.
 */
const { firstFit } = require('../algorithms');
const { toDateKey } = require('./slots');

/**
 * FIRST-FIT allocation — the earliest open slot on a given calendar day.
 *
 * Because the availability array is maintained in ascending order, the first
 * match is also the earliest match, so no minimum search is needed. The sort
 * invariant is doing the work.
 *
 * @complexity O(n) worst case
 */
const firstFitSlotOnDay = (sortedSlots = [], dateKey) => {
  return firstFit(sortedSlots, (slot) => toDateKey(slot) === dateKey);
};

/**
 * BUCKETING — group values into per-day counts in a single pass.
 *
 * A hash map keyed by calendar day: one pass, O(n), rather than iterating the
 * list of days and rescanning every value for each one, which would be
 * O(days * n).
 *
 * @complexity O(n)
 */
const bucketByDay = (values = [], keyOf = (v) => v) => {
  const buckets = {};

  values.forEach((value) => {
    const dateKey = toDateKey(keyOf(value));
    if (!dateKey) return;
    buckets[dateKey] = (buckets[dateKey] || 0) + 1;
  });

  return buckets;
};

/**
 * Per-day summary: how many slots are open, how many are booked, and whether
 * the day is *packed*.
 *
 *   PACKED = zero open slots AND at least one live booking.
 *
 * The second clause is what makes the predicate useful. Without it, a day the
 * admin simply never opened would look identical to a day that filled up — and
 * only the second should escalate a client to a coverage request.
 *
 * A day appearing in neither input is absent from the result entirely.
 *
 * @complexity O(n) bucketing + O(k log k) to order k days
 */
const buildDaySummary = (openSlots = [], bookings = [], options = {}) => {
  const {
    isActive = () => true,
    timeOf = (booking) => booking.appointmentTime
  } = options;

  const openByDay = bucketByDay(openSlots);
  const bookedByDay = bucketByDay(bookings.filter(isActive), timeOf);

  // Union of both key sets — a day may hold only open slots, only bookings, or both.
  const dateKeys = [...new Set([...Object.keys(openByDay), ...Object.keys(bookedByDay)])].sort();

  return dateKeys.map((dateKey) => {
    const open = openByDay[dateKey] || 0;
    const booked = bookedByDay[dateKey] || 0;

    return {
      date: dateKey,
      openSlots: open,
      bookedSlots: booked,
      packed: open === 0 && booked > 0
    };
  });
};

/**
 * Days on which a designer is fully booked.
 *
 * @complexity O(n + k log k)
 */
const getPackedDates = (openSlots = [], bookings = [], options = {}) => {
  return buildDaySummary(openSlots, bookings, options)
    .filter(day => day.packed)
    .map(day => day.date);
};

module.exports = {
  firstFitSlotOnDay,
  bucketByDay,
  buildDaySummary,
  getPackedDates
};
