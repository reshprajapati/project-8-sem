// Collection names, shared by every storage adapter. Each name is also the
// JSON file name and the top-level key inside it, e.g. data/users.json -> { users: [] }.
const COLLECTIONS = [
  'users',
  'appointments',
  'designs',
  'coverageRequests',
  'projects'
];

module.exports = { COLLECTIONS };
