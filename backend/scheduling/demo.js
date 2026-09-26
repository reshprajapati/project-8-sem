/**
 * Runnable demonstration of every scheduling algorithm.
 *
 *   npm run sched:demo
 *
 * Fixed sample data and no database, so the output is identical every time and
 * each algorithm can be shown in isolation.
 */
const {
  reserveSlot,
  releaseSlot,
  detectConflict,
  findConflictingSlots,
  firstFitSlotOnDay,
  bucketByDay,
  buildDaySummary,
  getPackedDates,
  scoreCandidate,
  isFeasibleCandidate
} = require('./index');

const { sortSlots, rankDesignersByFitness } = require('../algorithms');

const rule = (title) => {
  console.log(`\n${'='.repeat(66)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(66));
};

const step = (label) => console.log(`\n-- ${label}`);
const show = (label, value) => console.log(`   ${label.padEnd(28)} ${value}`);
const short = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16).replace('T', ' ') : 'null');

/* ------------------------------------------------------------ sample data */

const CALENDAR = sortSlots([
  '2026-10-15T07:15:00.000Z',
  '2026-09-30T06:15:00.000Z',
  '2026-10-27T17:15:00.000Z',
  '2026-09-30T06:15:00.000Z',   // duplicate, on purpose
  '2026-10-05T08:15:00.000Z'
]);

const APPOINTMENTS = [
  { _id: 'a1', appointmentTime: '2026-10-15T07:15:00.000Z', status: 'confirmed' },
  { _id: 'a2', appointmentTime: '2026-10-27T17:15:00.000Z', status: 'cancelled' },
  { _id: 'a3', appointmentTime: '2026-09-30T06:15:00.000Z', status: 'pending' }
];

// The one domain rule these algorithms need, injected rather than hard-coded.
const isActive = (a) => a.status !== 'cancelled';
const RULES = { isActive };

/* ===================================================== 1. SLOT LIFECYCLE */

rule('1. SLOT LIFECYCLE - reserve / release');
step('the designer calendar');
CALENDAR.forEach((s, i) => console.log(`     [${i}] ${short(s)}`));

const BOOKED_TIME = '2026-10-15T07:15:00.000Z';
const afterReserve = reserveSlot(CALENDAR, BOOKED_TIME);
const afterRelease = releaseSlot(afterReserve, BOOKED_TIME);

show('before', `${CALENDAR.length} slots`);
show('after RESERVE (booked)', `${afterReserve.length} slots  -  ${short(BOOKED_TIME)} removed`);
show('after RELEASE (cancelled)', `${afterRelease.length} slots  -  returned and re-sorted`);
show('symmetry holds', JSON.stringify(afterRelease) === JSON.stringify(CALENDAR));

step('why the pair matters');
console.log('     Booking removes a slot; cancelling puts it back. If either half');
console.log('     were missing the calendar would drift - shrinking on every');
console.log('     cancellation, or double-offering a time already taken.');
console.log('     Complexity: reserve O(n), release O(n log n) to re-sort.');

/* ================================================= 2. CONFLICT DETECTION */

rule('2. CONFLICT DETECTION - O(n) with early exit');
show('booked at 10-15 07:15?', detectConflict(APPOINTMENTS, '2026-10-15T07:15:00.000Z', RULES));
show('booked at 10-05 08:15?', detectConflict(APPOINTMENTS, '2026-10-05T08:15:00.000Z', RULES));
show('cancelled one ignored',
  `${detectConflict(APPOINTMENTS, '2026-10-27T17:15:00.000Z', RULES)}  (a2 is cancelled, so its slot is free)`);
show('excludeId when rescheduling',
  `${detectConflict(APPOINTMENTS, '2026-10-15T07:15:00.000Z', { ...RULES, excludeId: 'a1' })}  (an appointment cannot clash with itself)`);
show('invalid input', detectConflict(APPOINTMENTS, 'not-a-date', RULES));

step('why not binary search here');
console.log('     Appointments are not stored in time order, so the search key is');
console.log('     unsorted. Sorting them on every check would cost O(n log n) to');
console.log('     save an O(n) scan - strictly worse. An index on appointmentTime');
console.log('     is the real fix at scale.');

/* =============================================== 3. CALENDAR EDIT GUARD */

rule('3. CALENDAR EDIT GUARD - set intersection O(n+m)');
step('an admin tries to overwrite the calendar; what is already taken?');
const blocked = findConflictingSlots(CALENDAR, APPOINTMENTS, RULES);
blocked.forEach(c => console.log(`     BLOCKED  ${short(c)}`));
show('outcome', `${blocked.length} conflict(s) -> 409, the edit is refused`);

step('why hashing beats a nested loop');
console.log(`     naive:  for each proposed slot, scan every appointment`);
console.log(`             = O(n*m) = ${CALENDAR.length} x ${APPOINTMENTS.length}`);
console.log(`     here:   hash the booked times once, then O(1) per lookup`);
console.log(`             = O(n+m) = ${CALENDAR.length} + ${APPOINTMENTS.length}`);
console.log('     This is the largest single complexity win in the project.');

/* ==================================================== 4. SLOT ALLOCATION */

rule('4. SLOT ALLOCATION - first-fit, O(n)');
show('earliest on 2026-10-15', short(firstFitSlotOnDay(CALENDAR, '2026-10-15')));
show('earliest on 2026-09-30', short(firstFitSlotOnDay(CALENDAR, '2026-09-30')));
show('nothing on 2026-12-01', String(firstFitSlotOnDay(CALENDAR, '2026-12-01')));

step('why first == earliest');
console.log('     The calendar is kept ascending, so the first match is also the');
console.log('     smallest match. Maintaining the sort invariant removes the need');
console.log('     to search for a minimum at all.');

/* ================================================= 5. CALENDAR SUMMARY */

rule('5. CALENDAR SUMMARY - single-pass bucketing, O(n)');
step('bucketByDay over the open slots');
console.log(`     ${JSON.stringify(bucketByDay(CALENDAR))}`);

const OPEN = ['2026-10-15T09:00:00.000Z'];
const BOOKINGS = [
  { appointmentTime: '2026-10-15T07:15:00.000Z', status: 'confirmed' },
  { appointmentTime: '2026-11-20T07:15:00.000Z', status: 'confirmed' }
];

step('buildDaySummary: open vs booked vs packed');
buildDaySummary(OPEN, BOOKINGS, RULES).forEach(d =>
  console.log(`     ${d.date}   open=${d.openSlots}  booked=${d.bookedSlots}  packed=${d.packed}`)
);
show('packed dates', getPackedDates(OPEN, BOOKINGS, RULES).join(', '));

step('the definition, and why the second clause exists');
console.log('     PACKED = zero open slots AND at least one live booking.');
console.log('');
console.log('     2026-10-15  still has an open slot        -> not packed');
console.log('     2026-11-20  no open slot, but is booked   -> PACKED');
console.log('     2026-12-01  neither: never opened at all  -> absent entirely');
console.log('');
console.log('     Without the second clause, a day the admin simply never opened');
console.log('     would look identical to a day that filled up. Only the second');
console.log('     should escalate a client to a coverage request.');

/* ================================================= 6. DESIGNER MATCHING */

rule('6. DESIGNER MATCHING - filter, score, rank');

const DAY = '2026-10-15';
const POOL = [
  {
    _id: 'p1', name: 'Bela Rao',
    availability: ['2026-10-15T11:00:00.000Z'],
    bookings: [
      { appointmentTime: '2026-10-01T09:00:00.000Z', status: 'confirmed' },
      { appointmentTime: '2026-10-02T09:00:00.000Z', status: 'confirmed' }
    ]
  },
  {
    _id: 'p2', name: 'Arun Mehta',
    availability: ['2026-10-15T09:00:00.000Z'],
    bookings: Array.from({ length: 7 }, (unused, i) => ({
      appointmentTime: `2026-09-0${i + 1}T09:00:00.000Z`,
      status: 'confirmed'
    }))
  },
  {
    _id: 'p3', name: 'Full Fiona',
    availability: [],
    bookings: [{ appointmentTime: '2026-10-15T08:00:00.000Z', status: 'confirmed' }]
  },
  {
    _id: 'p4', name: 'Chen Wei',
    availability: ['2026-10-20T09:00:00.000Z'],
    bookings: []
  }
];

console.log(`\n   A client wants a designer who is fully booked on ${DAY}.`);
console.log('   The admin needs a ranked list of substitutes.');

step(`PHASE 1 - FILTER: who can take work on ${DAY} at all?`);
const feasible = POOL.filter(d => {
  const can = isFeasibleCandidate(d.availability, d.bookings, DAY, RULES);
  console.log(`     ${d.name.padEnd(12)} ${can ? 'keep' : 'DROP  - packed that day'}`);
  return can;
});

step('PHASE 2 - SCORE: compute the two ranking keys');
const scored = feasible.map(d => scoreCandidate(d, d.availability, d.bookings, DAY, RULES));
scored.forEach(c =>
  console.log(`     ${c.name.padEnd(12)} openOnDay=${c.slotsOnRequestedDay.length}  liveBookings=${c.liveBookings}`)
);

step('PHASE 3 - RANK: two-key comparator (algorithms/comparators.js)');
const ranked = rankDesignersByFitness(scored);
ranked.forEach((c, i) =>
  console.log(`     ${i + 1}. ${c.name.padEnd(12)} openOnDay=${c.slotsOnRequestedDay.length}  liveBookings=${c.liveBookings}`)
);

step('reading the result');
console.log('     Bela and Arun are both free that day, so the primary key ties.');
console.log('     Bela wins the tiebreak: 2 bookings against Arun\'s 7.');
console.log('     Chen is free overall but not on this day, so ranks last.');
console.log('     Fiona never reached scoring - the filter dropped her.');

step('what kind of algorithm this is');
console.log('     A greedy heuristic, not an optimal assignment. Each request is');
console.log('     matched on its own against current state, with no lookahead and');
console.log('     no reshuffling of bookings already made. For an admin tool that');
console.log('     is the right trade: a human approves the suggestion, so an');
console.log('     explainable ordering matters more than a provably optimal one.');

/* =============================================================== SUMMARY */

rule('SUMMARY');
console.log(`
   ALGORITHM                              TECHNIQUE              COMPLEXITY
   --------------------------------------------------------------------------
   reserveSlot          remove a booked slot   filter              O(n)
   releaseSlot          return a cancelled one filter + re-sort    O(n log n)
   detectConflict       one time vs bookings   linear + early exit O(n)
   findConflictingSlots many slots vs bookings set intersection    O(n + m)
   firstFitSlotOnDay    earliest open slot     first-fit on sorted O(n)
   bucketByDay          group by calendar day  hash bucketing      O(n)
   buildDaySummary      open/booked/packed     bucket + order days O(n + k log k)
   getPackedDates       fully-booked days      filter the summary  O(n + k log k)
   isFeasibleCandidate  can they take work?    day summary lookup  O(n + k log k)
   scoreCandidate       the two ranking keys   count and filter    O(n)

   Ranking itself is rankDesignersByFitness in algorithms/ - it is a pure
   sort, so it belongs with the other sorting code.
`);
