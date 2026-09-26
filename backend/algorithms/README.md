# Algorithms module

Generic sorting and searching primitives.

Nothing here knows anything about this project's domain - no slots, no bookings,
no designers. The domain algorithms built on these live in
[`../scheduling`](../scheduling), which depends on this module and not the other
way round.

Every function here is **pure** — no database, no network, no Express. That is
what lets `demo.js` exercise the whole module without a running server.

```
algorithms/
├── comparators.js   ordering rules — the hand-written part of "sorting"
├── sorting.js       sort operations built on those comparators
├── searching.js     search operations, grouped by complexity class
├── index.js         barrel export
├── demo.js          runnable demonstration of every algorithm
└── README.md        this file
```

## See it run

```bash
npm run algo:demo
```

Prints each algorithm executing against fixed sample data, with the reasoning
and complexity for each. For the scheduling algorithms built on these, run
`npm run sched:demo`.

---

## Sorting

> **Note on what is and is not implemented here.**
> The sort itself is `Array.prototype.sort`, which V8 implements as **TimSort** —
> a stable hybrid of merge sort and insertion sort, O(n log n) worst case and
> O(n) on already-ordered input. This module implements the **comparators**, not
> the sorting algorithm. Claiming otherwise would be inaccurate.

| Function | Algorithm | Complexity |
|---|---|---|
| `sortSlots(slots)` | `Set` dedupe, then TimSort | O(n) + O(n log n) |
| `sortByNewest(records)` | TimSort + `byNewest` | O(n log n) |
| `sortByName(records)` | TimSort + locale collator | O(n log n) |
| `sortByDate(records, field, dir)` | TimSort + generated comparator | O(n log n) |
| `rankDesignersByFitness(list)` | TimSort + **two-key** comparator | O(n log n) |

### Comparators

| Comparator | Orders by |
|---|---|
| `byChronological` | date ascending |
| `byNewest` | `createdAt` descending |
| `byDateField(field, dir)` | any date field, either direction |
| `byName` | `name`, via `localeCompare` |
| `byDesignerFitness` | **two keys** — see below |

### The two-key comparator

The only non-trivial ordering in the project. It ranks candidate designers when
an admin is reassigning a coverage request:

```js
const byDesignerFitness = (a, b) => {
  const aOpen = (a.slotsOnRequestedDay || []).length;
  const bOpen = (b.slotsOnRequestedDay || []).length;

  if (aOpen !== bOpen) {
    return bOpen - aOpen;                                 // primary key
  }

  return (a.liveBookings || 0) - (b.liveBookings || 0);    // tiebreak key
};
```

* **Primary key** — open slots on the requested day, descending. A designer who
  is already free that day is the best answer.
* **Tiebreak key** — total live bookings, ascending. Among equally-free
  designers, the work goes to whoever is carrying the least.

The tiebreak is what spreads load. Without it, one designer absorbs every
reassignment.

The pattern generalises: compare on the primary key, and fall through to the
next key only when the primary ties.

---

## Searching

Three complexity classes. Choosing the right one is the point.

### O(n) — linear scan

| Function | Notes |
|---|---|
| `linearFindBy(items, fn)` | first match, or `null` |
| `findById(items, id)` | lookup by `_id` — what the file driver uses |
| `findIndexById(items, id)` | position, for update and delete |
| `existsWhere(items, fn)` | **early exit** — stops at the first match |
| `firstFit(sortedItems, fn)` | first match on sorted input *is* the smallest match |

### O(1) — hash lookup

| Function | Notes |
|---|---|
| `toLookupSet(items, keyFn)` | O(n) to build, O(1) per later lookup |
| `intersect(candidates, set)` | turns an O(n·m) nested loop into O(n+m) |
| `inSet(set, key)` | single membership test |

### O(log n) — binary search

| Function | Notes |
|---|---|
| `binarySearchSlot(sortedSlots, target)` | index, or `-1` |
| `containsSlot(sortedSlots, target)` | membership test — replaces O(n) `includes` |

```js
let low = 0;
let high = sortedSlots.length - 1;

while (low <= high) {
  const mid = low + Math.floor((high - low) / 2);
  const midTime = timeOf(sortedSlots[mid]);

  if (midTime === wanted) return mid;
  if (midTime < wanted) low = mid + 1;
  else high = mid - 1;
}

return -1;
```

**Precondition: the input must be sorted ascending.** Every slot array in this
project passes through `sortSlots()`, so the invariant holds — and binary search
is only correct because it does. `mid` is computed as
`low + (high - low) / 2` rather than `(low + high) / 2`, which cannot overflow.

Why it matters as the calendar grows:

| Slots | `includes` | binary search |
|---:|---:|---:|
| 10 | up to 10 | 4 |
| 100 | up to 100 | 7 |
| 1,000 | up to 1,000 | 10 |
| 100,000 | up to 100,000 | 17 |

---

## Where each one is used

This module is not a demonstration bolted onto the side — the application
imports from it.

| Caller | Uses |
|---|---|
| `scheduling/` | `sortSlots`, `firstFit`, `existsWhere`, `toLookupSet`, `intersect` |
| `utils/schedule.js` | `sortSlots`, `containsSlot` (re-exported as `hasSlot`) |
| `controllers/appointmentController.js` | `hasSlot` (binary search), `byChronological`, `byNewest` |
| `controllers/adminController.js` | `rankDesignersByFitness`, `sortByName`, `byNewest`, `existsWhere` |
| `controllers/projectController.js` | `byNewest` |
| `controllers/designController.js` | `byNewest` |
| `db/adapters/fileAdapter.js` | `findById`, `findIndexById`, `linearFindBy` |

The binary search is the one genuine upgrade the extraction produced: slot
membership in the booking path was an O(n) `Array.includes` and is now O(log n).

---

## Not implemented, and why

**Binary search over the appointments list.** Appointments are not stored in
time order, so the search key is unsorted and binary search does not apply.
Sorting them on every conflict check would cost O(n log n) to save an O(n)
scan — strictly worse. Indexing `appointmentTime` in MongoDB is the real fix at
scale.

**A hand-written merge or quick sort.** The built-in sort is TimSort, which is
stable and already optimal for this data. Replacing it would be slower and
less correct, and the comparators are where the actual logic lives.
