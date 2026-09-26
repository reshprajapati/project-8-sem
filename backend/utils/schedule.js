/**
 * Domain layer over the two algorithm modules.
 *
 *   algorithms/   generic sorting and searching primitives
 *   scheduling/   slot lifecycle, conflicts, calendar aggregation, matching
 *
 * Both are written generically: they take arrays and injected predicates, and
 * neither knows what an appointment is. This file supplies the project's domain
 * rules — what counts as a live booking, where a designer's availability lives —
 * and re-exports the result with the signatures the controllers already use.
 */
const { sorting, searching } = require('../algorithms');
const scheduling = require('../scheduling');

const LOCATION_FIELDS = ['street', 'city', 'state', 'zipCode', 'country'];

/** A booking occupies its slot unless it has been cancelled. */
const isActiveAppointment = (appointment) => {
  return appointment.status !== 'cancelled';
};

// The domain rule every scheduling algorithm in this file needs.
const APPOINTMENT_RULES = { isActive: isActiveAppointment };

/* --------------------------------- re-exported from the algorithm modules */

// Canonical ISO form, or null. See scheduling/slots.js.
const normalizeSlot = (value) => scheduling.normalizeSlot(value);

// Local calendar-day key, e.g. 2026-03-14. Used as the per-day bucket key.
const toDateKey = (value) => scheduling.toDateKey(value);

const isFutureSlot = (slot) => scheduling.isFutureSlot(slot);

// Dedupe + chronological sort. The sorted-and-unique invariant this establishes
// is what makes first-fit allocation and binary search correct.
const sortSlots = (slots = []) => sorting.sortSlots(slots);

// O(log n) membership test over a sorted slot array, in place of an O(n)
// Array.includes. See algorithms/searching.js.
const hasSlot = (sortedSlots, slot) => searching.containsSlot(sortedSlots, slot);

// Remove a booked slot / return a cancelled one. Whether a slot *should* come
// back is policy and stays with the caller; these handle the mechanics.
const reserveSlot = (slots, slot) => scheduling.reserveSlot(slots, slot);
const releaseSlot = (slots, slot) => scheduling.releaseSlot(slots, slot);

/* ------------------------------------------------------ domain-bound wrappers */

const getDesignerAvailability = (designer) => {
  return sortSlots(Array.isArray(designer?.availability) ? designer.availability : []);
};

const hasCompleteLocation = (location) => {
  if (!location || typeof location !== 'object') {
    return false;
  }

  return LOCATION_FIELDS.every(field => {
    return typeof location[field] === 'string' && location[field].trim() !== '';
  });
};

/** Earliest open slot on a calendar day — first-fit over the sorted array. */
const firstOpenSlotOnDay = (sortedSlots, dateKey) => {
  return scheduling.firstFitSlotOnDay(sortedSlots, dateKey);
};

/** Does a live booking already occupy this time? Pass excludeId when rescheduling. */
const hasBookingAt = (appointments, slot, excludeId = null) => {
  return scheduling.detectConflict(appointments, slot, { ...APPOINTMENT_RULES, excludeId });
};

/** Which of these proposed slots are already booked? O(n+m) via a hash set. */
const conflictingSlots = (proposedSlots, appointments) => {
  return scheduling.findConflictingSlots(proposedSlots, appointments, APPOINTMENT_RULES);
};

/**
 * A designer is "packed" on a day when they have no open slot left on it but
 * do hold at least one live booking. A day with neither open slots nor
 * bookings was simply never opened by the admin.
 */
const buildDaySummary = (availability = [], appointments = []) => {
  return scheduling.buildDaySummary(availability, appointments, APPOINTMENT_RULES);
};

const getPackedDates = (availability = [], appointments = []) => {
  return scheduling.getPackedDates(availability, appointments, APPOINTMENT_RULES);
};

/** Score one designer as a coverage candidate for a given day. */
const scoreDesignerForDay = (designer, availability, appointments, dateKey) => {
  return scheduling.scoreCandidate(designer, availability, appointments, dateKey, APPOINTMENT_RULES);
};

/** Can this designer take more work on that day? */
const canTakeWorkOnDay = (availability, appointments, dateKey) => {
  return scheduling.isFeasibleCandidate(availability, appointments, dateKey, APPOINTMENT_RULES);
};

module.exports = {
  LOCATION_FIELDS,
  normalizeSlot,
  sortSlots,
  hasSlot,
  reserveSlot,
  releaseSlot,
  isFutureSlot,
  getDesignerAvailability,
  hasCompleteLocation,
  toDateKey,
  isActiveAppointment,
  firstOpenSlotOnDay,
  hasBookingAt,
  conflictingSlots,
  buildDaySummary,
  getPackedDates,
  scoreDesignerForDay,
  canTakeWorkOnDay
};
