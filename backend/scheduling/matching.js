/**
 * Load-balanced designer matching — the algorithm behind coverage suggestions.
 *
 * When a client wants a designer who is fully booked, an admin has to appoint a
 * substitute. Rather than listing everyone, the system runs three phases:
 *
 *   PHASE 1  FILTER  drop candidates who cannot take the work at all
 *   PHASE 2  SCORE   compute the two ranking keys for each survivor
 *   PHASE 3  RANK    order by those keys (algorithms/comparators.js)
 *
 * It is a greedy heuristic, not an optimal assignment: each request is matched
 * on its own against the current state, with no lookahead and no reshuffling of
 * bookings already made. That is the right trade for an admin tool — the output
 * is a ranked suggestion a human approves, so an explainable ordering matters
 * more than a provably optimal one.
 *
 * Phases 1 and 2 live here. Phase 3 is `rankDesignersByFitness`, which is a
 * pure sort and therefore belongs with the other sorting code.
 */
const { buildDaySummary } = require('./calendar');
const { toDateKey } = require('./slots');

/**
 * PHASE 1 — can this designer take work on `dateKey`?
 *
 * A designer whose day is already packed cannot, so they are excluded before
 * scoring rather than scored and then ignored.
 *
 * @complexity O(n + k log k)
 */
const isFeasibleCandidate = (openSlots = [], bookings = [], dateKey, options = {}) => {
  const day = buildDaySummary(openSlots, bookings, options).find(entry => entry.date === dateKey);
  return !(day && day.packed);
};

/**
 * PHASE 2 — score one designer as a candidate for `dateKey`.
 *
 * Produces exactly the two keys the ranking comparator reads:
 *
 *   slotsOnRequestedDay   primary key — free on the exact day wins
 *   liveBookings          tiebreak key — lighter overall load wins
 *
 * The remaining fields are what the admin console displays alongside each
 * suggestion.
 *
 * @complexity O(n)
 */
const scoreCandidate = (designer, openSlots = [], bookings = [], dateKey, options = {}) => {
  const { isActive = () => true } = options;

  return {
    _id: designer._id,
    name: designer.name,
    specialization: designer.specialization,
    experience: designer.experience,
    profileImage: designer.profileImage,
    slotsOnRequestedDay: openSlots.filter(slot => toDateKey(slot) === dateKey),
    totalOpenSlots: openSlots.length,
    liveBookings: bookings.filter(isActive).length
  };
};

module.exports = {
  isFeasibleCandidate,
  scoreCandidate
};
