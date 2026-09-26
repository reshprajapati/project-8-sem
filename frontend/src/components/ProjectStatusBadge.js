import React from 'react';
import './ProjectStatusBadge.css';

export const PROJECT_STATUS_LABELS = {
  requested: 'Requested',
  assigned: 'Assigned',
  'in-progress': 'In Progress',
  submitted: 'Awaiting Approval',
  approved: 'Approved',
  cancelled: 'Cancelled'
};

export const PROJECT_STATUS_HINTS = {
  requested: 'Waiting for an admin to assign a designer.',
  assigned: 'A designer has been assigned and scheduled.',
  'in-progress': 'Your designer is working on it.',
  submitted: 'The design is with the admin for approval.',
  approved: 'Approved. The final design is ready to view.',
  cancelled: 'This project was cancelled.'
};

const ProjectStatusBadge = ({ status }) => (
  <span className={`project-status ${status}`}>
    {PROJECT_STATUS_LABELS[status] || status}
  </span>
);

export default ProjectStatusBadge;
