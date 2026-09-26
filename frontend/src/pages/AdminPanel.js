import React, { Component } from 'react';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import ProjectStatusBadge from '../components/ProjectStatusBadge';
import {
  approveProject,
  assignCoverageRequest,
  assignProject,
  cancelProjectAsAdmin,
  createDesigner,
  declineCoverageRequest,
  getAdminDesigners,
  getAdminOverview,
  getAdminProjects,
  getAllAppointments,
  getCoverageRequests,
  getCoverageSuggestions,
  getStudioCalendar,
  rejectProject,
  rescheduleProject,
  updateDesignerAvailability
} from '../services/api';
import './AdminPanel.css';

const initialDesignerForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  specialization: '',
  experience: ''
};

const formatDateTime = (value) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const formatDate = (value) => new Date(value).toLocaleDateString([], { dateStyle: 'medium' });

const toDateTimeInputValue = (value) => {
  const date = new Date(value);
  const pad = (input) => String(input).padStart(2, '0');
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-') +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Ordered to follow the studio flow: a request arrives, gets assigned and
// scheduled, is worked on, then approved.
const TABS = [
  { key: 'projectRequests', label: 'Client Requests', badge: 'newRequests' },
  { key: 'projects', label: 'Project Status' },
  { key: 'calendar', label: 'Schedule' },
  { key: 'approvals', label: 'Approvals', badge: 'awaitingApproval' },
  { key: 'requests', label: 'Coverage', badge: 'pendingRequests' },
  { key: 'calendars', label: 'Designer Calendars' },
  { key: 'designers', label: 'Designers' },
  { key: 'appointments', label: 'Appointments' }
];

const PROJECT_FILTERS = ['all', 'requested', 'assigned', 'in-progress', 'submitted', 'approved', 'cancelled'];

class AdminPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'projectRequests',
      overview: null,
      designers: [],
      requests: [],
      appointments: [],
      projects: [],
      calendarEntries: [],
      projectFilter: 'all',
      projectDraft: {},
      reviewDraft: {},
      suggestionsByRequest: {},
      assignmentDraft: {},
      designerForm: initialDesignerForm,
      selectedDesignerId: '',
      slotInput: '',
      feedback: { type: '', message: '' },
      loading: true,
      savingDesigner: false,
      savingCalendar: false,
      busyRequestId: '',
      busyProjectId: ''
    };
  }

  componentDidMount() {
    this.loadConsole();
  }

  loadConsole = async () => {
    this.setState({ loading: true });
    try {
      const [overviewRes, designersRes, requestsRes, appointmentsRes, projectsRes, calendarRes] = await Promise.all([
        getAdminOverview(),
        getAdminDesigners(),
        getCoverageRequests(),
        getAllAppointments(),
        getAdminProjects(),
        getStudioCalendar()
      ]);

      const designers = designersRes.data.designers || [];

      this.setState(prev => ({
        overview: overviewRes.data.overview,
        designers,
        requests: requestsRes.data.requests || [],
        appointments: appointmentsRes.data.appointments || [],
        projects: projectsRes.data.projects || [],
        calendarEntries: calendarRes.data.entries || [],
        selectedDesignerId: prev.selectedDesignerId || designers[0]?._id || ''
      }));
    } catch (err) {
      console.error('Error loading admin console:', err);
      this.setState({ feedback: { type: 'error', message: 'Unable to load the admin console right now.' } });
    } finally {
      this.setState({ loading: false });
    }
  };

  setFeedback = (type, message) => this.setState({ feedback: { type, message } });

  // ------------------------------------------------------------- suggestions

  loadSuggestions = async (requestId) => {
    try {
      const response = await getCoverageSuggestions(requestId);
      this.setState(prev => ({
        suggestionsByRequest: {
          ...prev.suggestionsByRequest,
          [requestId]: response.data.suggestions || []
        }
      }));
    } catch (err) {
      console.error('Error loading suggestions:', err);
      this.setFeedback('error', 'Unable to load available designers for that request.');
    }
  };

  handleDraftChange = (requestId, field, value) => {
    this.setState(prev => ({
      assignmentDraft: {
        ...prev.assignmentDraft,
        [requestId]: { ...prev.assignmentDraft[requestId], [field]: value }
      }
    }));
  };

  handleAssign = async (requestId) => {
    const draft = this.state.assignmentDraft[requestId] || {};

    if (!draft.designerId) {
      this.setFeedback('error', 'Choose a designer to appoint before assigning.');
      return;
    }

    this.setState({ busyRequestId: requestId, feedback: { type: '', message: '' } });

    try {
      const response = await assignCoverageRequest(requestId, {
        designerId: draft.designerId,
        appointmentTime: draft.appointmentTime ? new Date(draft.appointmentTime).toISOString() : undefined,
        adminNote: draft.adminNote || ''
      });

      this.setFeedback('success', response.data.message);
      await this.loadConsole();
    } catch (err) {
      console.error('Error assigning coverage request:', err);
      this.setFeedback('error', err.response?.data?.message || 'Unable to assign this request.');
    } finally {
      this.setState({ busyRequestId: '' });
    }
  };

  handleDecline = async (requestId) => {
    const shouldDecline = window.confirm('Decline this coverage request?');
    if (!shouldDecline) return;

    this.setState({ busyRequestId: requestId });

    try {
      await declineCoverageRequest(requestId, {});
      this.setFeedback('success', 'Request declined.');
      await this.loadConsole();
    } catch (err) {
      console.error('Error declining coverage request:', err);
      this.setFeedback('error', err.response?.data?.message || 'Unable to decline this request.');
    } finally {
      this.setState({ busyRequestId: '' });
    }
  };

  // ----------------------------------------------------------------- projects

  handleProjectDraft = (projectId, field, value) => {
    this.setState(prev => ({
      projectDraft: {
        ...prev.projectDraft,
        [projectId]: { ...prev.projectDraft[projectId], [field]: value }
      }
    }));
  };

  handleReviewDraft = (projectId, value) => {
    this.setState(prev => ({ reviewDraft: { ...prev.reviewDraft, [projectId]: value } }));
  };

  runProjectAction = async (projectId, action, successFallback) => {
    this.setState({ busyProjectId: projectId, feedback: { type: '', message: '' } });
    try {
      const response = await action();
      this.setFeedback('success', response.data.message || successFallback);
      await this.loadConsole();
      return true;
    } catch (err) {
      console.error('Project action failed:', err);
      this.setFeedback('error', err.response?.data?.message || 'That action could not be completed.');
      return false;
    } finally {
      this.setState({ busyProjectId: '' });
    }
  };

  handleAssignProject = async (projectId) => {
    const draft = this.state.projectDraft[projectId] || {};

    if (!draft.designerId) {
      this.setFeedback('error', 'Choose a designer for this project.');
      return;
    }

    if (!draft.scheduledAt) {
      this.setFeedback('error', 'Choose a date and time to schedule this project.');
      return;
    }

    await this.runProjectAction(projectId, () => assignProject(projectId, {
      designerId: draft.designerId,
      scheduledAt: new Date(draft.scheduledAt).toISOString(),
      adminNote: draft.adminNote || ''
    }), 'Project assigned.');
  };

  handleReschedule = async (projectId) => {
    const draft = this.state.projectDraft[projectId] || {};

    if (!draft.scheduledAt) {
      this.setFeedback('error', 'Pick a new date and time first.');
      return;
    }

    await this.runProjectAction(projectId, () => rescheduleProject(projectId, {
      scheduledAt: new Date(draft.scheduledAt).toISOString()
    }), 'Project rescheduled.');
  };

  handleApprove = async (projectId) => {
    await this.runProjectAction(projectId, () => approveProject(projectId, {}), 'Design approved.');
  };

  handleReject = async (projectId) => {
    const reason = (this.state.reviewDraft[projectId] || '').trim();

    if (!reason) {
      this.setFeedback('error', 'Tell the designer what needs changing before sending it back.');
      return;
    }

    const sent = await this.runProjectAction(projectId, () => rejectProject(projectId, { rejectionReason: reason }), 'Sent back to the designer.');
    if (sent) {
      this.setState(prev => ({ reviewDraft: { ...prev.reviewDraft, [projectId]: '' } }));
    }
  };

  handleCancelProject = async (projectId) => {
    const confirmed = window.confirm('Cancel this project?');
    if (!confirmed) return;

    await this.runProjectAction(projectId, () => cancelProjectAsAdmin(projectId, {}), 'Project cancelled.');
  };

  // ---------------------------------------------------------------- calendars

  get selectedDesigner() {
    return this.state.designers.find(designer => designer._id === this.state.selectedDesignerId) || null;
  }

  persistCalendar = async (designerId, availability, successMessage) => {
    this.setState({ savingCalendar: true, feedback: { type: '', message: '' } });
    try {
      await updateDesignerAvailability(designerId, availability);
      this.setFeedback('success', successMessage);
      await this.loadConsole();
    } catch (err) {
      console.error('Error updating calendar:', err);
      this.setFeedback('error', err.response?.data?.message || 'Unable to update this calendar.');
    } finally {
      this.setState({ savingCalendar: false });
    }
  };

  handleAddSlot = async (event) => {
    event.preventDefault();
    const { slotInput } = this.state;
    const designer = this.selectedDesigner;

    if (!designer) {
      this.setFeedback('error', 'Choose a designer first.');
      return;
    }

    if (!slotInput) {
      this.setFeedback('error', 'Pick a date and time before adding a slot.');
      return;
    }

    const slotDate = new Date(slotInput);
    if (Number.isNaN(slotDate.getTime())) {
      this.setFeedback('error', 'Please choose a valid date and time.');
      return;
    }

    const slot = slotDate.toISOString();
    if ((designer.availability || []).includes(slot)) {
      this.setFeedback('error', 'That time is already open on this calendar.');
      return;
    }

    await this.persistCalendar(
      designer._id,
      [...(designer.availability || []), slot],
      `Opened ${formatDateTime(slot)} on ${designer.name}'s calendar.`
    );
    this.setState({ slotInput: '' });
  };

  handleRemoveSlot = async (slot) => {
    const designer = this.selectedDesigner;
    if (!designer) return;

    await this.persistCalendar(
      designer._id,
      (designer.availability || []).filter(entry => entry !== slot),
      'Slot removed from the calendar.'
    );
  };

  // ---------------------------------------------------------------- designers

  handleDesignerFormChange = (event) => {
    const { name, value } = event.target;
    this.setState(prev => ({ designerForm: { ...prev.designerForm, [name]: value } }));
  };

  handleCreateDesigner = async (event) => {
    event.preventDefault();
    this.setState({ savingDesigner: true, feedback: { type: '', message: '' } });

    try {
      const response = await createDesigner(this.state.designerForm);
      this.setFeedback('success', `${response.data.designer.name} was added. Open their calendar to give them booking dates.`);
      this.setState({ designerForm: initialDesignerForm, activeTab: 'calendars' });
      await this.loadConsole();
    } catch (err) {
      console.error('Error adding designer:', err);
      this.setFeedback('error', err.response?.data?.message || 'Unable to add this designer.');
    } finally {
      this.setState({ savingDesigner: false });
    }
  };

  // ------------------------------------------------------------------ renders

  renderProjectRequests() {
    const { projects, designers, projectDraft, busyProjectId } = this.state;
    const waiting = projects.filter(project => project.status === 'requested');

    return (
      <>
        <div className="section-header">
          <div>
            <h2>Client Requests</h2>
            <p>New design requests waiting for a designer. Assigning also puts the project on the schedule.</p>
          </div>
        </div>

        {waiting.length === 0 ? (
          <div className="empty-state"><p>No new requests. Everything has been assigned.</p></div>
        ) : (
          <div className="request-list">
            {waiting.map(project => {
              const draft = projectDraft[project._id] || {};
              const isBusy = busyProjectId === project._id;

              return (
                <article key={project._id} className="request-card">
                  <div className="request-head">
                    <div>
                      <h3>{project.title}</h3>
                      <p className="request-meta">
                        {project.client?.name || 'Client'} &middot; {project.surfaceArea} &middot; requested {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <p className="request-detail">{project.description}</p>
                  <p className="request-detail">
                    Location: {project.location?.street}, {project.location?.city}, {project.location?.state} {project.location?.zipCode}
                  </p>
                  {project.budget > 0 ? <p className="request-detail">Budget: Rs. {project.budget}</p> : null}
                  {project.client?.phone ? <p className="request-detail">Phone: {project.client.phone}</p> : null}

                  <div className="assign-box">
                    <div className="form-group">
                      <label htmlFor={`pd-${project._id}`}>Assign designer</label>
                      <select
                        id={`pd-${project._id}`}
                        value={draft.designerId || ''}
                        onChange={(event) => this.handleProjectDraft(project._id, 'designerId', event.target.value)}
                      >
                        <option value="">Choose a designer</option>
                        {designers.map(designer => (
                          <option key={designer._id} value={designer._id}>
                            {designer.name}
                            {designer.specialization ? ` — ${designer.specialization}` : ''}
                            {` (${designer.bookedCount} booked)`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`ps-${project._id}`}>Schedule for</label>
                      <input
                        id={`ps-${project._id}`}
                        type="datetime-local"
                        min={toDateTimeInputValue(new Date())}
                        value={draft.scheduledAt || ''}
                        onChange={(event) => this.handleProjectDraft(project._id, 'scheduledAt', event.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`pn-${project._id}`}>Note for the designer (optional)</label>
                      <input
                        id={`pn-${project._id}`}
                        value={draft.adminNote || ''}
                        onChange={(event) => this.handleProjectDraft(project._id, 'adminNote', event.target.value)}
                        placeholder="Client wants to keep the existing flooring"
                      />
                    </div>

                    <div className="card-actions">
                      <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => this.handleAssignProject(project._id)}>
                        {isBusy ? 'Assigning...' : 'Assign and Schedule'}
                      </button>
                      <button type="button" className="btn btn-danger" disabled={isBusy} onClick={() => this.handleCancelProject(project._id)}>
                        Decline
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </>
    );
  }

  renderProjects() {
    const { projects, projectFilter, projectDraft, busyProjectId } = this.state;
    const visible = projectFilter === 'all'
      ? projects
      : projects.filter(project => project.status === projectFilter);

    return (
      <>
        <div className="section-header">
          <div>
            <h2>Project Status</h2>
            <p>Every project in the studio and where it has got to.</p>
          </div>
        </div>

        <div className="filter-row">
          {PROJECT_FILTERS.map(filter => (
            <button
              key={filter}
              type="button"
              className={`filter-chip ${projectFilter === filter ? 'active' : ''}`}
              onClick={() => this.setState({ projectFilter: filter })}
            >
              {filter === 'all' ? 'All' : filter.replace('-', ' ')}
              <span className="chip-count">
                {filter === 'all' ? projects.length : projects.filter(p => p.status === filter).length}
              </span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="empty-state"><p>Nothing in this state right now.</p></div>
        ) : (
          <div className="request-list">
            {visible.map(project => {
              const draft = projectDraft[project._id] || {};
              const isBusy = busyProjectId === project._id;
              const canReschedule = !['approved', 'cancelled'].includes(project.status);

              return (
                <article key={project._id} className="request-card">
                  <div className="request-head">
                    <div>
                      <h3>{project.title}</h3>
                      <p className="request-meta">
                        {project.client?.name || 'Client'}
                        {project.designer ? ` → ${project.designer.name}` : ' → unassigned'}
                        {project.scheduledAt ? ` · ${formatDateTime(project.scheduledAt)}` : ''}
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <p className="request-detail">{project.description}</p>
                  {project.adminNote ? <p className="request-detail">Your note: {project.adminNote}</p> : null}
                  {project.rejectionReason ? <p className="request-detail warn">Sent back: {project.rejectionReason}</p> : null}

                  {Array.isArray(project.history) && project.history.length > 0 ? (
                    <p className="project-trail">
                      {project.history.map(entry => entry.action).join(' → ')}
                    </p>
                  ) : null}

                  {canReschedule ? (
                    <div className="inline-row">
                      <input
                        type="datetime-local"
                        aria-label={`Reschedule ${project.title}`}
                        min={toDateTimeInputValue(new Date())}
                        value={draft.scheduledAt || ''}
                        onChange={(event) => this.handleProjectDraft(project._id, 'scheduledAt', event.target.value)}
                      />
                      <button type="button" className="btn btn-secondary" disabled={isBusy} onClick={() => this.handleReschedule(project._id)}>
                        Reschedule
                      </button>
                      <button type="button" className="btn btn-danger" disabled={isBusy} onClick={() => this.handleCancelProject(project._id)}>
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </>
    );
  }

  renderApprovals() {
    const { projects, reviewDraft, busyProjectId } = this.state;
    const waiting = projects.filter(project => project.status === 'submitted');
    const approved = projects.filter(project => project.status === 'approved');

    return (
      <>
        <div className="section-header">
          <div>
            <h2>Design Approvals</h2>
            <p>Work the designers have submitted. Approving releases it to the client.</p>
          </div>
        </div>

        {waiting.length === 0 ? (
          <div className="empty-state"><p>Nothing waiting for approval.</p></div>
        ) : (
          <div className="request-list">
            {waiting.map(project => {
              const isBusy = busyProjectId === project._id;

              return (
                <article key={project._id} className="request-card">
                  <div className="request-head">
                    <div>
                      <h3>{project.submission?.title || project.title}</h3>
                      <p className="request-meta">
                        {project.designer?.name || 'Designer'} for {project.client?.name || 'client'} &middot; submitted {formatDateTime(project.submittedAt)}
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  {project.submission?.imageUrl ? (
                    <img src={project.submission.imageUrl} alt={project.submission.title} className="submission-image" />
                  ) : null}

                  <p className="request-detail">{project.submission?.description}</p>
                  {project.submission?.notes ? <p className="request-detail">Designer note: {project.submission.notes}</p> : null}

                  <div className="assign-box">
                    <div className="form-group">
                      <label htmlFor={`rv-${project._id}`}>Changes needed (only if sending back)</label>
                      <input
                        id={`rv-${project._id}`}
                        value={reviewDraft[project._id] || ''}
                        onChange={(event) => this.handleReviewDraft(project._id, event.target.value)}
                        placeholder="Lighten the palette and resend"
                      />
                    </div>

                    <div className="card-actions">
                      <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => this.handleApprove(project._id)}>
                        {isBusy ? 'Working...' : 'Approve and Release'}
                      </button>
                      <button type="button" className="btn btn-secondary" disabled={isBusy} onClick={() => this.handleReject(project._id)}>
                        Send Back
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {approved.length > 0 ? (
          <div className="handled-list">
            <h3>Approved</h3>
            {approved.map(project => (
              <div key={project._id} className="handled-row">
                <span className="status assigned">approved</span>
                <span>
                  {project.submission?.title || project.title} &middot; {project.designer?.name} for {project.client?.name}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </>
    );
  }

  renderSchedule() {
    const { calendarEntries } = this.state;
    const slots = calendarEntries.map(entry => entry.at);

    return (
      <>
        <div className="section-header">
          <div>
            <h2>Studio Schedule</h2>
            <p>Scheduled projects and live consultations together. Pick a highlighted day to see what is on.</p>
          </div>
        </div>

        {calendarEntries.length === 0 ? (
          <div className="empty-state"><p>Nothing is scheduled yet.</p></div>
        ) : (
          <AvailabilityCalendar
            slots={slots}
            emptyMessage="Nothing is scheduled yet."
            renderSlotActions={(slot) => (
              <div className="calendar-entry-list">
                {calendarEntries.filter(entry => entry.at === slot).map(entry => (
                  <span key={entry.kind + entry._id} className={`calendar-entry ${entry.kind}`}>
                    {entry.kind === 'project' ? '📐' : '💬'} {entry.title}
                    <em>{entry.designer?.name || 'unassigned'} &middot; {entry.client?.name || 'client'}</em>
                  </span>
                ))}
              </div>
            )}
          />
        )}
      </>
    );
  }

  renderRequests() {
    const { requests, suggestionsByRequest, assignmentDraft, busyRequestId } = this.state;
    const pending = requests.filter(request => request.status === 'pending');
    const handled = requests.filter(request => request.status !== 'pending');

    return (
      <>
        <div className="section-header">
          <div>
            <h2>Packed-Date Requests</h2>
            <p>Clients who wanted a date their chosen designer could not take. Appoint someone who is free.</p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="empty-state"><p>No requests are waiting. Everything is covered.</p></div>
        ) : (
          <div className="request-list">
            {pending.map(request => {
              const suggestions = suggestionsByRequest[request._id];
              const draft = assignmentDraft[request._id] || {};
              const chosen = suggestions?.find(item => item._id === draft.designerId);
              const isBusy = busyRequestId === request._id;

              return (
                <article key={request._id} className="request-card">
                  <div className="request-head">
                    <div>
                      <h3>{request.client?.name || 'Client'}</h3>
                      <p className="request-meta">
                        wanted <strong>{request.requestedDesigner?.name || 'a designer'}</strong> on{' '}
                        <strong>{formatDate(request.requestedDate)}</strong>
                      </p>
                    </div>
                    <span className="status pending">packed</span>
                  </div>

                  <p className="request-detail">Project type: {request.surfaceArea}</p>
                  <p className="request-detail">
                    Location: {request.location?.street}, {request.location?.city}, {request.location?.state} {request.location?.zipCode}
                  </p>
                  {request.budget > 0 ? <p className="request-detail">Budget: Rs. {request.budget}</p> : null}
                  {request.description ? <p className="request-detail">{request.description}</p> : null}

                  {!suggestions ? (
                    <button type="button" className="btn btn-secondary" onClick={() => this.loadSuggestions(request._id)}>
                      Find Available Designers
                    </button>
                  ) : suggestions.length === 0 ? (
                    <div className="empty-state small">
                      <p>No other designer is free that day. Open a slot on someone's calendar first.</p>
                    </div>
                  ) : (
                    <div className="assign-box">
                      <div className="form-group">
                        <label htmlFor={`designer-${request._id}`}>Appoint designer</label>
                        <select
                          id={`designer-${request._id}`}
                          value={draft.designerId || ''}
                          onChange={(event) => this.handleDraftChange(request._id, 'designerId', event.target.value)}
                        >
                          <option value="">Choose a designer</option>
                          {suggestions.map(suggestion => (
                            <option key={suggestion._id} value={suggestion._id}>
                              {suggestion.name}
                              {suggestion.slotsOnRequestedDay.length > 0
                                ? ` — ${suggestion.slotsOnRequestedDay.length} slot(s) free that day`
                                : ' — no slot that day, set a time'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {chosen && chosen.slotsOnRequestedDay.length > 0 ? (
                        <div className="form-group">
                          <label htmlFor={`slot-${request._id}`}>Time</label>
                          <select
                            id={`slot-${request._id}`}
                            value={draft.appointmentTime || ''}
                            onChange={(event) => this.handleDraftChange(request._id, 'appointmentTime', event.target.value)}
                          >
                            <option value="">First open time that day</option>
                            {chosen.slotsOnRequestedDay.map(slot => (
                              <option key={slot} value={slot}>{formatDateTime(slot)}</option>
                            ))}
                          </select>
                        </div>
                      ) : chosen ? (
                        <div className="form-group">
                          <label htmlFor={`time-${request._id}`}>Set a time</label>
                          <input
                            id={`time-${request._id}`}
                            type="datetime-local"
                            min={toDateTimeInputValue(new Date())}
                            value={draft.appointmentTime || ''}
                            onChange={(event) => this.handleDraftChange(request._id, 'appointmentTime', event.target.value)}
                          />
                        </div>
                      ) : null}

                      <div className="form-group">
                        <label htmlFor={`note-${request._id}`}>Note for the designer (optional)</label>
                        <input
                          id={`note-${request._id}`}
                          value={draft.adminNote || ''}
                          onChange={(event) => this.handleDraftChange(request._id, 'adminNote', event.target.value)}
                          placeholder="Covering for a fully booked colleague"
                        />
                      </div>

                      <div className="card-actions">
                        <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => this.handleAssign(request._id)}>
                          {isBusy ? 'Assigning...' : 'Appoint Designer'}
                        </button>
                        <button type="button" className="btn btn-danger" disabled={isBusy} onClick={() => this.handleDecline(request._id)}>
                          Decline
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {handled.length > 0 ? (
          <div className="handled-list">
            <h3>Already handled</h3>
            {handled.map(request => (
              <div key={request._id} className="handled-row">
                <span className={`status ${request.status}`}>{request.status}</span>
                <span>
                  {request.client?.name} &middot; {formatDate(request.requestedDate)}
                  {request.assignedDesigner ? ` → ${request.assignedDesigner.name}` : ''}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </>
    );
  }

  renderCalendars() {
    const { designers, selectedDesignerId, slotInput, savingCalendar } = this.state;
    const designer = this.selectedDesigner;

    return (
      <>
        <div className="section-header">
          <div>
            <h2>Designer Calendars</h2>
            <p>You own every booking date. Designers only see what you open here.</p>
          </div>
        </div>

        {designers.length === 0 ? (
          <div className="empty-state"><p>No designers yet. Add one first.</p></div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="designerPicker">Designer</label>
              <select
                id="designerPicker"
                value={selectedDesignerId}
                onChange={(event) => this.setState({ selectedDesignerId: event.target.value })}
              >
                {designers.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name} — {item.openSlots} open, {item.bookedCount} booked
                  </option>
                ))}
              </select>
            </div>

            {designer ? (
              <>
                <form className="slot-form" onSubmit={this.handleAddSlot}>
                  <div className="form-group">
                    <label htmlFor="slotInput">Open a new booking date</label>
                    <input
                      id="slotInput"
                      type="datetime-local"
                      value={slotInput}
                      min={toDateTimeInputValue(new Date())}
                      onChange={(event) => this.setState({ slotInput: event.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={savingCalendar}>
                    {savingCalendar ? 'Saving...' : 'Add Date'}
                  </button>
                </form>

                <AvailabilityCalendar
                  slots={designer.availability || []}
                  packedDates={(designer.days || []).filter(day => day.packed).map(day => day.date)}
                  emptyMessage="No booking dates opened for this designer yet."
                  renderSlotActions={(slot) => (
                    <button type="button" className="btn btn-danger slot-remove-btn" onClick={() => this.handleRemoveSlot(slot)}>
                      Remove
                    </button>
                  )}
                />
              </>
            ) : null}
          </>
        )}
      </>
    );
  }

  renderDesignerForm() {
    const { designerForm, savingDesigner } = this.state;

    return (
      <>
        <div className="section-header">
          <div>
            <h2>Add a Designer</h2>
            <p>Create the account, then open booking dates on their calendar.</p>
          </div>
        </div>

        <form className="admin-form" onSubmit={this.handleCreateDesigner}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input id="name" name="name" value={designerForm.name} onChange={this.handleDesignerFormChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={designerForm.email} onChange={this.handleDesignerFormChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Temporary Password</label>
              <input id="password" name="password" type="password" minLength={6} value={designerForm.password} onChange={this.handleDesignerFormChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" value={designerForm.phone} onChange={this.handleDesignerFormChange} />
            </div>
            <div className="form-group">
              <label htmlFor="specialization">Specialization</label>
              <input id="specialization" name="specialization" value={designerForm.specialization} onChange={this.handleDesignerFormChange} placeholder="Luxury residential" />
            </div>
            <div className="form-group">
              <label htmlFor="experience">Years of Experience</label>
              <input id="experience" name="experience" type="number" min="0" value={designerForm.experience} onChange={this.handleDesignerFormChange} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={savingDesigner}>
            {savingDesigner ? 'Adding...' : 'Add Designer'}
          </button>
        </form>
      </>
    );
  }

  renderAppointments() {
    const { appointments } = this.state;

    return (
      <>
        <div className="section-header">
          <div>
            <h2>All Appointments</h2>
            <p>Every booking in the studio, including the ones you reassigned.</p>
          </div>
        </div>

        {appointments.length === 0 ? (
          <div className="empty-state"><p>No appointments yet.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Client</th>
                  <th>Designer</th>
                  <th>Project</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(appointment => (
                  <tr key={appointment._id}>
                    <td>{formatDateTime(appointment.appointmentTime)}</td>
                    <td>{appointment.client?.name || '—'}</td>
                    <td>
                      {appointment.designer?.name || '—'}
                      {appointment.originalDesigner ? (
                        <span className="covering">covering for {appointment.originalDesigner.name}</span>
                      ) : null}
                    </td>
                    <td>{appointment.surfaceArea}</td>
                    <td><span className={`status ${appointment.status}`}>{appointment.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  }

  render() {
    const { user } = this.props;
    const { activeTab, overview, feedback, loading } = this.state;

    if (loading) return <div className="loading">Loading admin console...</div>;

    return (
      <div className="dashboard admin-panel">
        <div className="dashboard-header admin-header">
          <div>
            <h1>{user.name}, you run the schedule</h1>
            <p>Open booking dates for every designer, and appoint cover when a client wants a day that is already full.</p>
          </div>
          {overview ? (
            <div className="header-stats admin-stats">
              <div className="stat-card">
                <strong>{overview.newRequests}</strong>
                <span>New requests</span>
              </div>
              <div className="stat-card">
                <strong>{overview.activeProjects}</strong>
                <span>Active projects</span>
              </div>
              <div className="stat-card">
                <strong>{overview.awaitingApproval}</strong>
                <span>Awaiting approval</span>
              </div>
              <div className="stat-card">
                <strong>{overview.designers}</strong>
                <span>Designers</span>
              </div>
            </div>
          ) : null}
        </div>

        {feedback.message ? (
          <div className={`dashboard-alert ${feedback.type}`}>{feedback.message}</div>
        ) : null}

        <div className="admin-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => this.setState({ activeTab: tab.key, feedback: { type: '', message: '' } })}
            >
              {tab.label}
              {tab.badge && overview?.[tab.badge] > 0 ? (
                <span className="tab-badge">{overview[tab.badge]}</span>
              ) : null}
            </button>
          ))}
        </div>

        <section className="dashboard-section">
          {activeTab === 'projectRequests' ? this.renderProjectRequests() : null}
          {activeTab === 'projects' ? this.renderProjects() : null}
          {activeTab === 'calendar' ? this.renderSchedule() : null}
          {activeTab === 'approvals' ? this.renderApprovals() : null}
          {activeTab === 'requests' ? this.renderRequests() : null}
          {activeTab === 'calendars' ? this.renderCalendars() : null}
          {activeTab === 'designers' ? this.renderDesignerForm() : null}
          {activeTab === 'appointments' ? this.renderAppointments() : null}
        </section>
      </div>
    );
  }
}

export default AdminPanel;
