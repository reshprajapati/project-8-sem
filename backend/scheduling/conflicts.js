/**
 * Conflict detection — the guards that make double-booking impossible.
 *
 * Two different shapes, with two different complexity profiles:
 *
 *   detectConflict        one target time against many bookings   O(n)
 *   findConflictingSlots  many proposed slots against many bookings  O(n+m)
 *
 * The second could be written as a nested loop at O(n*m). Hashing the booked
 * side first is the largest single complexity win in this project.
 */
const { existsWhere, toLookupSet, intersect } = require('../algorithms');
const { normalizeSlot } = require('./slots');

/**
 * Does any live booking already occupy `targetSlot`?
 *
 * A linear scan with early exit. Appointments are not stored in time order, so
 * the search key is unsorted and binary search does not apply here — sorting
 * them on every check would cost O(n log n) to save an O(n) scan, which is
 * strictly worse.
 *
 * `excludeId` exists for rescheduling: an appointment must not be treated as a
 * conflict with itself.
 *
 * @param {object} options.isActive   which bookings occupy their slot
 * @param {object} options.timeOf     where the time lives on a booking
 * @param {object} options.excludeId  a booking to ignore
 * @complexity O(n) worst case, O(1) best case
 */
const detectConflict = (bookings = [], targetSlot, options = {}) => {
  const {
    isActive = () => true,
    timeOf = (booking) => booking.appointmentTime,
    excludeId = null
  } = options;

  const target = normalizeSlot(targetSlot);
  if (!target) return false;

  return existsWhere(bookings, (booking) => {
    if (excludeId && booking._id === excludeId) return false;
    if (!isActive(booking)) return false;
    return normalizeSlot(timeOf(booking)) === target;
  });
};

/**
 * Which of `proposedSlots` are already booked?
 *
 * Used when an admin overwrites a designer's calendar — they must not be able
 * to remove a slot a client has already taken. A non-empty result means the
 * whole edit is refused.
 *
 * @complexity O(n + m)
 */
const findConflictingSlots = (proposedSlots = [], bookings = [], options = {}) => {
  const {
    isActive = () => true,
    timeOf = (booking) => booking.appointmentTime
  } = options;

  const taken = toLookupSet(bookings.filter(isActive), (booking) => normalizeSlot(timeOf(booking)));
  return intersect(proposedSlots.map(normalizeSlot), taken);
};

module.exports = {
  detectConflict,
  findConflictingSlots
};
