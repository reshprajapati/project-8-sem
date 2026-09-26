/**
 * Runnable demonstration of every algorithm in this module.
 *
 *   npm run algo:demo
 *
 * Uses fixed sample data and no database, so the output is identical every
 * time and each algorithm can be shown in isolation.
 */
const {
  // sorting
  sortSlots,
  sortByNewest,
  sortByName,
  rankDesignersByFitness,
  byDesignerFitness,
  // searching
  findById,
  findIndexById,
  existsWhere,
  firstFit,
  toLookupSet,
  intersect,
  binarySearchSlot,
  containsSlot,
} = require('./index');

const rule = (title) => {
  console.log(`\n${'='.repeat(66)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(66));
};

const step = (label) => console.log(`\n-- ${label}`);
const show = (label, value) => console.log(`   ${label.padEnd(28)} ${value}`);
const short = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16).replace('T', ' ') : 'null');

/* ------------------------------------------------------------ sample data */

const RAW_SLOTS = [
  '2026-10-15T07:15:00.000Z',
  '2026-09-30T06:15:00.000Z',
  '2026-10-27T17:15:00.000Z',
  '2026-09-30T06:15:00.000Z',   // duplicate, on purpose
  '2026-10-05T08:15:00.000Z'
];

const DESIGNS = [
  { _id: 'd1', title: 'Luxury Bedroom',  createdAt: '2026-08-11T10:00:00.000Z' },
  { _id: 'd2', title: 'Kitchen',         createdAt: '2026-09-02T10:00:00.000Z' },
  { _id: 'd3', title: 'Marble Bathroom', createdAt: '2026-07-19T10:00:00.000Z' }
];

const DESIGNERS = [
  { _id: 'u1', name: 'Zara Khan',   slotsOnRequestedDay: [],                       liveBookings: 1 },
  { _id: 'u2', name: 'Arun Mehta',  slotsOnRequestedDay: ['2026-10-15T09:00:00Z'], liveBookings: 7 },
  { _id: 'u3', name: 'Bela Rao',    slotsOnRequestedDay: ['2026-10-15T11:00:00Z'], liveBookings: 2 },
  { _id: 'u4', name: 'Chen Wei',    slotsOnRequestedDay: [],                       liveBookings: 0 }
];

const APPOINTMENTS = [
  { _id: 'a1', designerId: 'u2', appointmentTime: '2026-10-15T07:15:00.000Z', status: 'confirmed' },
  { _id: 'a2', designerId: 'u2', appointmentTime: '2026-10-27T17:15:00.000Z', status: 'cancelled' },
  { _id: 'a3', designerId: 'u3', appointmentTime: '2026-09-30T06:15:00.000Z', status: 'pending' }
];

const isActive = (a) => a.status !== 'cancelled';
const RULES = { isActive };

/* =============================================================== SORTING */

rule('SORTING 1 - sortSlots: dedupe O(n) then sort O(n log n)');
step(`input (${RAW_SLOTS.length} values, one duplicate)`);
RAW_SLOTS.forEach(s => console.log(`     ${short(s)}`));
const sorted = sortSlots(RAW_SLOTS);
step(`output (${sorted.length} values, unique and ascending)`);
sorted.forEach(s => console.log(`     ${short(s)}`));
show('duplicate removed by', 'new Set() - hashing, O(n)');
show('order established by', 'TimSort + byChronological');

rule('SORTING 2 - sortByNewest: descending by createdAt');
step('before');
DESIGNS.forEach(d => console.log(`     ${d.title.padEnd(18)} ${d.createdAt.slice(0, 10)}`));
step('after');
sortByNewest(DESIGNS).forEach(d => console.log(`     ${d.title.padEnd(18)} ${d.createdAt.slice(0, 10)}`));
show('why b before a', 'reversing the operands reverses the order');

rule('SORTING 3 - sortByName: locale-aware alphabetical');
show('result', sortByName(DESIGNERS).map(d => d.name).join(', '));
show('uses', 'localeCompare, not < - handles accents correctly');

rule('SORTING 4 - rankDesignersByFitness: TWO-KEY comparator');
console.log('\n   Primary key : open slots on the requested day, DESCENDING');
console.log('   Tiebreak key: total live bookings, ASCENDING');
step('candidates');
DESIGNERS.forEach(d =>
  console.log(`     ${d.name.padEnd(12)} openOnDay=${d.slotsOnRequestedDay.length}  bookings=${d.liveBookings}`)
);
step('ranked');
rankDesignersByFitness(DESIGNERS).forEach((d, i) =>
  console.log(`     ${i + 1}. ${d.name.padEnd(12)} openOnDay=${d.slotsOnRequestedDay.length}  bookings=${d.liveBookings}`)
);
step('why that order');
console.log('     Arun and Bela both have 1 open slot, so the primary key ties.');
console.log('     The tiebreak sends Bela (2 bookings) ahead of Arun (7).');
console.log('     Zara and Chen have no slot that day, so they rank last -');
console.log('     and between them Chen (0 bookings) comes first.');
step('comparator called directly');
show('byDesignerFitness(Arun,Bela)', byDesignerFitness(DESIGNERS[1], DESIGNERS[2]) + '  (positive => Bela first)');
show('byDesignerFitness(Bela,Zara)', byDesignerFitness(DESIGNERS[2], DESIGNERS[0]) + '  (negative => Bela first)');

/* ============================================================= SEARCHING */

rule('SEARCHING 1 - linear search, O(n)');
show('findById(DESIGNS, "d2")', findById(DESIGNS, 'd2').title);
show('findById(DESIGNS, "nope")', String(findById(DESIGNS, 'nope')));
show('findIndexById(DESIGNS, "d3")', findIndexById(DESIGNS, 'd3'));
show('cost', 'checks each item in turn until it matches');

rule('SEARCHING 2 - existsWhere, O(n) with EARLY EXIT');
let visited = 0;
const clash = existsWhere(APPOINTMENTS, (a) => {
  visited += 1;
  return isActive(a) && a.appointmentTime === '2026-10-15T07:15:00.000Z';
});
show('conflict found', clash);
show('items examined', `${visited} of ${APPOINTMENTS.length}`);
show('why it stopped', 'Array.some halts on the first match');

rule('SEARCHING 3 - hash lookup, O(1) per test');
const taken = toLookupSet(APPOINTMENTS.filter(isActive), (a) => a.appointmentTime);
show('booked times in the Set', taken.size);
const conflicting = intersect(sorted, taken);
step('admin proposes a new calendar; which times are already booked?');
conflicting.forEach(s => console.log(`     CLASH  ${short(s)}`));
show('naive approach', `nested loop = O(n*m) = ${sorted.length} x ${APPOINTMENTS.length}`);
show('this approach', `hash one side first = O(n+m) = ${sorted.length} + ${APPOINTMENTS.length}`);

rule('SEARCHING 4 - first-fit over a sorted array, O(n)');
const wantedDay = '2026-10-15';
show(`earliest slot on ${wantedDay}`, short(firstFit(sorted, (slot) => slot.startsWith(wantedDay))));
show('why first == earliest', 'the array is already ascending, so no min search');

rule('SEARCHING 5 - BINARY SEARCH, O(log n)');
step('the sorted calendar being searched');
sorted.forEach((s, i) => console.log(`     [${i}] ${short(s)}`));
const hit = '2026-10-15T07:15:00.000Z';
const miss = '2026-10-16T07:15:00.000Z';
show('binarySearchSlot(hit)', `index ${binarySearchSlot(sorted, hit)}`);
show('binarySearchSlot(miss)', `index ${binarySearchSlot(sorted, miss)}  (-1 = absent)`);
show('containsSlot(hit)', containsSlot(sorted, hit));
show('containsSlot(miss)', containsSlot(sorted, miss));

step('why it beats includes()');
[10, 100, 1000, 100000].forEach(n => {
  const steps = Math.ceil(Math.log2(n));
  console.log(`     ${String(n).padStart(6)} slots:  includes = up to ${String(n).padStart(6)} comparisons` +
              `  |  binary search = ${String(steps).padStart(2)}`);
});

step('correctness precondition');
console.log('     Binary search requires ascending input. Every slot array in');
console.log('     this project passes through sortSlots(), so the invariant');
console.log('     holds - and the algorithm is only correct because it does.');

/* =============================================================== SUMMARY */

rule('SUMMARY');
console.log(`
   SORTING                                        complexity
   -------------------------------------------------------------------
   sortSlots              dedupe + TimSort         O(n) + O(n log n)
   sortByNewest           TimSort + comparator     O(n log n)
   sortByName             TimSort + collator       O(n log n)
   rankDesignersByFitness TimSort + two keys       O(n log n)

   SEARCHING                                      complexity
   -------------------------------------------------------------------
   findById               linear scan              O(n)
   existsWhere            linear + early exit      O(n) / O(1) best
   firstFit               linear on sorted data    O(n)
   toLookupSet            build hash set           O(n)
   intersect              hash membership          O(n)
   binarySearchSlot       halve the range          O(log n)

   The scheduling algorithms built on these live in scheduling/ -
   run: npm run sched:demo

   SCHEDULING                                     complexity
   -------------------------------------------------------------------
   reserveSlot            filter one out           O(n)
   releaseSlot            add back + re-sort       O(n log n)
   detectConflict         linear + early exit      O(n)
   findConflictingSlots   set intersection         O(n + m)
   firstFitSlotOnDay      first-fit on sorted      O(n)
   bucketByDay            single-pass hash bucket  O(n)
   buildDaySummary        bucket + order days      O(n + k log k)
   scoreCandidate         count two keys           O(n)
   isFeasibleCandidate    day summary + lookup     O(n + k log k)
`);
