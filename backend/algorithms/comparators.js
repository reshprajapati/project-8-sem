/**
 * Comparator functions — the part of sorting this project actually implements.
 *
 * The sort itself is `Array.prototype.sort`, which V8 implements as TimSort:
 * a stable hybrid of merge sort and insertion sort, O(n log n) worst case and
 * O(n) on input that is already ordered. A comparator returns a negative
 * number when `a` should come first, a positive number when `b` should, and
 * zero when the two are equivalent.
 *
 * Every function here is pure: no I/O, no database, no domain lookups.
 */

/**
 * Oldest first. Accepts anything `new Date()` understands — ISO strings,
 * Date objects, epoch numbers.
 *
 * @complexity O(1) per comparison
 */
const byChronological = (a, b) => new Date(a) - new Date(b);

/**
 * Newest first. The operands are reversed relative to byChronological, which
 * is the whole difference between ascending and descending.
 *
 * @complexity O(1) per comparison
 */
const byOldestFirst = byChronological;

/**
 * Builds a comparator that orders records by one date field.
 *
 *   records.sort(byDateField('createdAt', 'desc'))
 *
 * @complexity O(1) per comparison
 */
const byDateField = (field, direction = 'asc') => {
  const sign = direction === 'desc' ? -1 : 1;
  return (a, b) => sign * (new Date(a[field]) - new Date(b[field]));
};

/**
 * Newest-created first — the ordering used for feeds of designs, projects
 * and requests, where the most recent item is the most relevant.
 *
 * @complexity O(1) per comparison
 */
const byNewest = byDateField('createdAt', 'desc');

/**
 * Alphabetical by name, using the locale collator rather than `<`.
 * `localeCompare` orders accented characters correctly, which a raw
 * code-point comparison does not.
 *
 * @complexity O(1) per comparison
 */
const byName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''));

/**
 * TWO-KEY COMPARATOR — the one non-trivial ordering in this project.
 *
 * Ranks candidate designers for a coverage request:
 *
 *   Primary key   how many slots they have open on the requested day, DESC.
 *                 Someone already free that day is the best answer.
 *   Tiebreak key  total live bookings, ASC.
 *                 Among equally-free designers, give the work to whoever is
 *                 carrying the least. This is what spreads load instead of
 *                 letting one designer absorb every reassignment.
 *
 * The pattern generalises: compare on the primary key, and only fall through
 * to the next key when the primary is a tie.
 *
 * @complexity O(1) per comparison
 */
const byDesignerFitness = (a, b) => {
  const aOpen = (a.slotsOnRequestedDay || []).length;
  const bOpen = (b.slotsOnRequestedDay || []).length;

  if (aOpen !== bOpen) {
    return bOpen - aOpen;              // primary: more open slots first
  }

  return (a.liveBookings || 0) - (b.liveBookings || 0);  // tiebreak: lighter load first
};

module.exports = {
  byChronological,
  byOldestFirst,
  byDateField,
  byNewest,
  byName,
  byDesignerFitness
};
