# Scheduling module

The domain algorithms of this project — slot allocation, conflict detection,
calendar aggregation and load-balanced designer matching.

Depends on [`../algorithms`](../algorithms) for the generic primitives (sorting,
linear and binary search, hash lookups) and adds the scheduling logic on top.
**The dependency runs one way only:** `algorithms/` knows nothing about slots,
bookings or designers.

```
scheduling/
├── slots.js       normalisation and the reserve/release lifecycle
├── conflicts.js   double-booking guards
├── calendar.js    per-day aggregation and first-fit allocation
├── matching.js    designer matching — filter, then score
├── index.js       barrel export
├── demo.js        runnable demonstration
└── README.md      this file
```

Every function is pure. Where one needs a domain rule — *"which bookings occupy
their slot?"* — it takes that rule as an **injected predicate** rather than
hard-coding it. That is what lets the whole module be exercised without a
database.

## See it run

```bash
npm run sched:demo
```

---

## Complexity at a glance

| Function | Technique | Complexity |
|---|---|---|
| `reserveSlot` | filter one out | O(n) |
| `releaseSlot` | add back, dedupe, re-sort | O(n log n) |
| `detectConflict` | linear scan, early exit | O(n) |
| `findConflictingSlots` | set intersection | O(n + m) |
| `firstFitSlotOnDay` | first-fit on sorted input | O(n) |
| `bucketByDay` | single-pass hash bucketing | O(n) |
| `buildDaySummary` | bucket + order k days | O(n + k log k) |
| `getPackedDates` | filter the summary | O(n + k log k) |
| `isFeasibleCandidate` | day summary + lookup | O(n + k log k) |
| `scoreCandidate` | count the two ranking keys | O(n) |

Ranking itself is `rankDesignersByFitness` in `algorithms/` — it is a pure sort,
so it belongs with the other sorting code.

---

## 1 · Slot lifecycle — `slots.js`

A slot is one bookable date-time, stored as a canonical ISO string. Normalising
on the way in is what lets every later comparison be a plain equality test
instead of date arithmetic.

```js
reserveSlot(calendar, slot)   // booking succeeded  -> take it off the calendar
releaseSlot(calendar, slot)   // booking cancelled  -> put it back, re-sorted
```

**These two must be symmetric.** If booking removed a slot but cancelling failed
to return it, the calendar would shrink on every cancellation. The demo asserts
`release(reserve(cal, s), s) === cal`.

Whether a released slot *should* come back is **policy, not mechanism** — this
project only returns slots still in the future, and that decision stays in the
controller. These functions only do the mechanics.

---

## 2 · Conflict detection — `conflicts.js`

Two shapes, two complexity profiles:

| | Question | Cost |
|---|---|---|
| `detectConflict` | one target time against many bookings | O(n) |
| `findConflictingSlots` | many proposed slots against many bookings | O(n + m) |

`detectConflict` is a **linear scan with early exit**, and takes `excludeId` for
rescheduling — an appointment must not be treated as clashing with itself.

`findConflictingSlots` guards a calendar overwrite: an admin must not be able to
delete a slot a client has already taken. A non-empty result refuses the whole
edit with a 409.

### Why hashing, not a nested loop

```
naive:  for each proposed slot, scan every appointment   O(n · m)
here:   hash the booked times once, then O(1) per test   O(n + m)
```

This is the largest single complexity win in the project.

### Why not binary search here

Appointments are **not** stored in time order, so the search key is unsorted.
Sorting them on every check would cost O(n log n) to save an O(n) scan —
strictly worse. An index on `appointmentTime` is the real fix at scale.

---

## 3 · Calendar — `calendar.js`

### First-fit allocation

```js
firstFitSlotOnDay(sortedSlots, '2026-10-15')   // earliest open slot that day
```

Because the calendar is kept ascending, **the first match is also the earliest
match** — so no minimum search is needed. Maintaining the sort invariant is what
buys that.

### Per-day bucketing

`bucketByDay` groups values into per-day counts in **one pass**, O(n) — rather
than iterating the list of days and rescanning every value for each one, which
would be O(days · n).

### The `packed` predicate

```
PACKED = zero open slots AND at least one live booking
```

| Day | Open | Booked | Packed |
|---|---:|---:|---|
| `2026-10-15` | 1 | 1 | no — still has room |
| `2026-11-20` | 0 | 1 | **yes** — filled up |
| `2026-12-01` | 0 | 0 | absent from the result entirely |

**The second clause is the whole point.** Without it, a day the admin simply
never opened would look identical to a day that filled up — and only the second
should escalate a client to a coverage request.

---

## 4 · Designer matching — `matching.js`

The algorithm behind coverage suggestions. When a client wants a designer who is
fully booked, an admin appoints a substitute — and the system ranks the options.

Three phases:

| Phase | Does | Lives in |
|---|---|---|
| **1 · FILTER** | drop anyone who cannot take the work at all | `isFeasibleCandidate` |
| **2 · SCORE** | compute the two ranking keys per survivor | `scoreCandidate` |
| **3 · RANK** | order by those keys | `algorithms/comparators.js` |

Filtering *before* scoring matters: a packed designer is excluded rather than
scored and then ignored.

`scoreCandidate` produces exactly the two keys the comparator reads:

| Key | Field | Direction |
|---|---|---|
| Primary | `slotsOnRequestedDay` | descending — free on the exact day wins |
| Tiebreak | `liveBookings` | ascending — lighter overall load wins |

Worked example from the demo:

```
PHASE 1 - FILTER
  Bela Rao     keep
  Arun Mehta   keep
  Full Fiona   DROP - packed that day
  Chen Wei     keep

PHASE 3 - RANK
  1. Bela Rao     openOnDay=1  liveBookings=2
  2. Arun Mehta   openOnDay=1  liveBookings=7
  3. Chen Wei     openOnDay=0  liveBookings=0
```

Bela and Arun tie on the primary key, so the tiebreak decides — Bela's 2
bookings beat Arun's 7. Chen is free overall but not on this day, so ranks last.

### What kind of algorithm this is

A **greedy heuristic**, not an optimal assignment. Each request is matched on its
own against current state, with no lookahead and no reshuffling of bookings
already made.

For an admin tool that is the right trade: a human approves the suggestion, so an
**explainable** ordering matters more than a provably optimal one. A true optimal
assignment across all pending requests would be a bipartite matching problem
(Hungarian algorithm, O(n³)) — more machinery than an admin queue of this size
justifies, and harder to explain to the person clicking the button.

---

## Where it is used

| Caller | Uses |
|---|---|
| `utils/schedule.js` | every export, bound to the project's domain rules |
| `controllers/appointmentController.js` | `reserveSlot`, `releaseSlot`, conflict detection |
| `controllers/adminController.js` | calendar guard, first-fit, filter + score |
| `controllers/userController.js` | day summary for the public designer calendar |

`utils/schedule.js` is the seam: it injects `isActive` (a booking occupies its
slot unless cancelled) once, then re-exports everything with the signatures the
controllers already used — which is why this module could be extracted without
touching a single route.
