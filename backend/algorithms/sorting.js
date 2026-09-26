/**
 * Sorting operations built on the comparators.
 *
 * None of these implement a sort from scratch — they wrap
 * `Array.prototype.sort` (TimSort in V8: stable, O(n log n) worst case) with
 * a comparator and, where useful, a deduplication pass.
 *
 * Every function returns a NEW array. Sorting in place would mutate a caller's
 * data, and several callers pass arrays they do not own.
 */
const { byChronological, byNewest, byName, byDesignerFitness } = require('./comparators');

/**
 * Deduplicate, then order oldest to newest.
 *
 * `new Set(...)` collapses duplicates by hashing — O(n) — which is cheaper
 * than sorting first and then scanning for adjacent equal pairs.
 *
 * This function is the reason the rest of the codebase may assume that any
 * array of slots is both unique and chronologically ordered. First-fit slot
 * selection and binary search both depend on that invariant.
 *
 * @complexity O(n) dedupe + O(n log n) sort
 */
const sortSlots = (slots = []) => {
  return [...new Set(slots)].sort(byChronological);
};

/**
 * Order records newest-created first.
 *
 * @complexity O(n log n)
 */
const sortByNewest = (records = []) => {
  return [...records].sort(byNewest);
};

/**
 * Order records alphabetically by `name`, locale-aware.
 *
 * @complexity O(n log n)
 */
const sortByName = (records = []) => {
  return [...records].sort(byName);
};

/**
 * Rank coverage-request candidates: most free on the requested day first,
 * lightest overall workload as the tiebreak.
 *
 * @complexity O(n log n)
 */
const rankDesignersByFitness = (candidates = []) => {
  return [...candidates].sort(byDesignerFitness);
};

/**
 * Order records by one date field in either direction.
 *
 * @complexity O(n log n)
 */
const sortByDate = (records = [], field, direction = 'asc') => {
  const sign = direction === 'desc' ? -1 : 1;
  return [...records].sort((a, b) => sign * (new Date(a[field]) - new Date(b[field])));
};

module.exports = {
  sortSlots,
  sortByNewest,
  sortByName,
  sortByDate,
  rankDesignersByFitness
};
