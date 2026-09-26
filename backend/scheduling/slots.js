/**
 * Slot primitives: normalisation and the reserve/release lifecycle.
 *
 * A "slot" is one bookable date-time on a designer's calendar, stored as a
 * canonical ISO string. Normalising on the way in is what lets every later
 * comparison be a plain equality test rather than date arithmetic.
 */
const { sortSlots } = require('../algorithms');

/**
 * Canonical ISO form, or null when the value is not a date.
 *
 * @complexity O(1)
 */
const normalizeSlot = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/**
 * Local calendar-day key, e.g. `2026-03-14` — the bucket key for per-day
 * aggregation.
 *
 * The format sorts correctly as plain text, so grouped days need no date
 * conversion to be ordered.
 *
 * @complexity O(1)
 */
const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
};

/**
 * Is this slot still in the future?
 *
 * @complexity O(1)
 */
const isFutureSlot = (slot) => {
  const date = new Date(slot);
  return !Number.isNaN(date.getTime()) && date > new Date();
};

/**
 * RESERVE — remove a slot from an availability array.
 *
 * Called when a booking succeeds. Pairs with `releaseSlot`, and that symmetry
 * is what keeps a calendar honest over time: a booking that removed a slot
 * while a cancellation failed to return it would silently shrink the calendar
 * on every cancelled appointment.
 *
 * @complexity O(n)
 */
const reserveSlot = (slots = [], slot) => {
  const target = normalizeSlot(slot);
  return slots.filter(entry => normalizeSlot(entry) !== target);
};

/**
 * RELEASE — return a slot to an availability array, keeping it sorted and
 * unique.
 *
 * Whether a released slot *should* come back is policy, not mechanism: the
 * caller decides (this project only returns slots still in the future). This
 * function handles the mechanics only.
 *
 * @complexity O(n log n)
 */
const releaseSlot = (slots = [], slot) => {
  const target = normalizeSlot(slot);
  if (!target) return sortSlots(slots);
  return sortSlots([...slots, target]);
};

module.exports = {
  normalizeSlot,
  toDateKey,
  isFutureSlot,
  reserveSlot,
  releaseSlot
};
