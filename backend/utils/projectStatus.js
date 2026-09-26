/**
 * The project pipeline:
 *
 *   requested -> assigned -> in-progress -> submitted -> approved
 *                                  ^            |
 *                                  +--rejected--+
 *
 * A project can be cancelled from anywhere before it is approved.
 */
const PROJECT_STATUSES = [
  'requested',
  'assigned',
  'in-progress',
  'submitted',
  'approved',
  'cancelled'
];

const STATUS_LABELS = {
  requested: 'Waiting for an admin to assign a designer',
  assigned: 'Designer assigned and scheduled',
  'in-progress': 'Designer is working on it',
  submitted: 'Waiting for admin approval',
  approved: 'Approved and shared with the client',
  cancelled: 'Cancelled'
};

const ALLOWED_TRANSITIONS = {
  requested: ['assigned', 'cancelled'],
  assigned: ['in-progress', 'cancelled'],
  'in-progress': ['submitted', 'cancelled'],
  // Rejection sends a submission back to the designer.
  submitted: ['approved', 'in-progress', 'cancelled'],
  approved: [],
  cancelled: []
};

const canTransition = (from, to) => {
  return (ALLOWED_TRANSITIONS[from] || []).includes(to);
};

const isOpenProject = (project) => {
  return project.status !== 'approved' && project.status !== 'cancelled';
};

/**
 * Appends an audit line so the admin console can show who moved a project and
 * when, without a separate collection.
 */
const withHistory = (project, entry) => {
  const history = Array.isArray(project.history) ? project.history : [];
  return [...history, { ...entry, at: new Date().toISOString() }];
};

module.exports = {
  PROJECT_STATUSES,
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
  canTransition,
  isOpenProject,
  withHistory
};
