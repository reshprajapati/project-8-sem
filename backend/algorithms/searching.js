/**
 * Searching operations, grouped by complexity class.
 *
 *   O(n)      linear scan          — unordered data, or a predicate that
 *                                    cannot be indexed
 *   O(1)      hash lookup          — repeated membership tests against the
 *                                    same set of keys
 *   O(log n)  binary search        — data already ordered on the search key
 *
 * Picking the right class is the point. A nested pair of linear scans is
 * O(n*m); hashing one side first makes the same work O(n+m).
 */

/* ------------------------------------------------------------------ O(n) */

/**
 * First item satisfying `predicate`, or null.
 *
 * @complexity O(n) worst case, stops at the first match
 */
const linearFindBy = (items = [], predicate) => {
  return items.find(predicate) ?? null;
};

/**
 * Locate a record by its `_id`.
 *
 * This is what the file-based storage driver uses. On MongoDB the identical
 * lookup resolves through the B-tree index on `_id` instead, which is
 * O(log n) — the same call, a different complexity class, decided entirely
 * by the storage adapter.
 *
 * @complexity O(n)
 */
const findById = (items = [], id) => {
  return items.find(item => item._id === id) ?? null;
};

/**
 * Position of a record by `_id`, or -1. Update and delete need the index,
 * not the value.
 *
 * @complexity O(n)
 */
const findIndexById = (items = [], id) => {
  return items.findIndex(item => item._id === id);
};

/**
 * Does any item satisfy `predicate`?
 *
 * Uses `Array.prototype.some`, which EARLY-EXITS: it stops the moment a match
 * is found rather than visiting the remaining items. For conflict detection
 * that matters — the answer is usually "no", but when it is "yes" the scan
 * ends immediately.
 *
 * @complexity O(n) worst case, O(1) best case
 */
const existsWhere = (items = [], predicate) => {
  return items.some(predicate);
};

/**
 * FIRST-FIT selection over an array that is already ordered.
 *
 * Because the input is sorted, the first item that fits is also the smallest
 * item that fits — so no minimum search is needed. Maintaining the sort
 * invariant elsewhere is what makes this shortcut correct.
 *
 * @complexity O(n) worst case
 */
const firstFit = (sortedItems = [], predicate) => {
  return sortedItems.find(predicate) ?? null;
};

/* ------------------------------------------------------------------ O(1) */

/**
 * Build a hash set of keys for repeated O(1) membership tests.
 *
 * @complexity O(n) to build, O(1) per later lookup
 */
const toLookupSet = (items = [], keyFn = (x) => x) => {
  return new Set(items.map(keyFn));
};

/**
 * Items of `candidates` that are present in `lookupSet`.
 *
 * The naive form of this check is a nested loop at O(n*m). Hashing one side
 * first reduces it to O(n+m), which is the single biggest complexity win in
 * this codebase.
 *
 * @complexity O(n), given a prebuilt set
 */
const intersect = (candidates = [], lookupSet) => {
  return candidates.filter(item => lookupSet.has(item));
};

/**
 * Is `key` present in `lookupSet`?
 *
 * @complexity O(1)
 */
const inSet = (lookupSet, key) => lookupSet.has(key);

/* -------------------------------------------------------------- O(log n) */

const timeOf = (value) => new Date(value).getTime();

/**
 * BINARY SEARCH over an array of date-time values sorted oldest to newest.
 *
 * PRECONDITION: `sortedSlots` is ascending. Every slot array in this project
 * passes through `sorting.sortSlots`, so the invariant holds — and binary
 * search is only correct because it does.
 *
 * Halves the remaining range on each step, so a 1,000-slot calendar costs
 * about 10 comparisons instead of 1,000.
 *
 * @returns index of the match, or -1
 * @complexity O(log n)
 */
const binarySearchSlot = (sortedSlots = [], target) => {
  const wanted = timeOf(target);
  if (Number.isNaN(wanted)) return -1;

  let low = 0;
  let high = sortedSlots.length - 1;

  while (low <= high) {
    // (low + high) / 2 can overflow in fixed-width integer languages;
    // this form cannot, and reads the same.
    const mid = low + Math.floor((high - low) / 2);
    const midTime = timeOf(sortedSlots[mid]);

    if (midTime === wanted) return mid;
    if (midTime < wanted) low = mid + 1;
    else high = mid - 1;
  }

  return -1;
};

/**
 * Membership test for a sorted slot array — the O(log n) replacement for
 * `Array.prototype.includes`, which is O(n).
 *
 * @complexity O(log n)
 */
const containsSlot = (sortedSlots = [], target) => {
  return binarySearchSlot(sortedSlots, target) !== -1;
};

module.exports = {
  // O(n)
  linearFindBy,
  findById,
  findIndexById,
  existsWhere,
  firstFit,
  // O(1)
  toLookupSet,
  intersect,
  inSet,
  // O(log n)
  binarySearchSlot,
  containsSlot
};
