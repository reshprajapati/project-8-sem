import React, { Component } from 'react';
import ProjectStatusBadge from './ProjectStatusBadge';
import { getAssignedProjects, startProject, submitDesign } from '../services/api';
import './DesignerProjects.css';

const emptySubmission = { title: '', description: '', imageUrl: '', notes: '' };

const formatDateTime = (value) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

class DesignerProjects extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      drafts: {},
      openFormId: '',
      feedback: { type: '', message: '' },
      loading: true,
      busyId: ''
    };
  }

  componentDidMount() {
    this.loadProjects();
  }

  loadProjects = async () => {
    try {
      const response = await getAssignedProjects();
      this.setState({ projects: response.data.projects || [] });
    } catch (err) {
      console.error('Error loading assigned projects:', err);
      this.setState({ feedback: { type: 'error', message: 'Unable to load your assigned projects.' } });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleDraftChange = (projectId, field, value) => {
    this.setState(prev => ({
      drafts: {
        ...prev.drafts,
        [projectId]: { ...(prev.drafts[projectId] || emptySubmission), [field]: value }
      }
    }));
  };

  handleStart = async (projectId) => {
    this.setState({ busyId: projectId, feedback: { type: '', message: '' } });
    try {
      await startProject(projectId, {});
      this.setState({ feedback: { type: 'success', message: 'Marked as in progress.' } });
      await this.loadProjects();
    } catch (err) {
      console.error('Error starting project:', err);
      this.setState({ feedback: { type: 'error', message: err.response?.data?.message || 'Unable to start this project.' } });
    } finally {
      this.setState({ busyId: '' });
    }
  };

  handleSubmitDesign = async (event, projectId) => {
    event.preventDefault();
    const draft = this.state.drafts[projectId] || emptySubmission;

    this.setState({ busyId: projectId, feedback: { type: '', message: '' } });
    try {
      await submitDesign(projectId, draft);
      this.setState(prev => ({
        feedback: { type: 'success', message: 'Sent to the admin for approval.' },
        openFormId: '',
        drafts: { ...prev.drafts, [projectId]: emptySubmission }
      }));
      await this.loadProjects();
    } catch (err) {
      console.error('Error submitting design:', err);
      this.setState({ feedback: { type: 'error', message: err.response?.data?.message || 'Unable to submit this design.' } });
    } finally {
      this.setState({ busyId: '' });
    }
  };

  render() {
    const { projects, drafts, openFormId, feedback, loading, busyId } = this.state;

    if (loading) return <p className="designer-projects-loading">Loading your assigned projects...</p>;

    const active = projects.filter(project => project.status !== 'cancelled');

    return (
      <div className="designer-projects">
        {feedback.message ? <div className={`dashboard-alert ${feedback.type}`}>{feedback.message}</div> : null}

        {active.length === 0 ? (
          <div className="empty-state">
            <p>No projects assigned to you yet. The studio admin assigns these.</p>
          </div>
        ) : (
          <div className="assigned-list">
            {active.map(project => {
              const draft = drafts[project._id] || emptySubmission;
              const isBusy = busyId === project._id;

              return (
                <article key={project._id} className="assigned-card">
                  <div className="assigned-head">
                    <div>
                      <h3>{project.title}</h3>
                      <p className="assigned-meta">
                        {project.client?.name || 'Client'} &middot; {project.surfaceArea}
                        {project.scheduledAt ? ` · ${formatDateTime(project.scheduledAt)}` : ''}
                      </p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <p className="assigned-brief">{project.description}</p>

                  <p className="assigned-detail">
                    Address: {project.location?.street}, {project.location?.city}, {project.location?.state} {project.location?.zipCode}
                  </p>
                  {project.budget > 0 ? <p className="assigned-detail">Budget: Rs. {project.budget}</p> : null}
                  {project.adminNote ? <p className="assigned-note">Admin note: {project.adminNote}</p> : null}

                  {project.rejectionReason ? (
                    <div className="revision-note">
                      <strong>Changes requested:</strong> {project.rejectionReason}
                    </div>
                  ) : null}

                  {project.status === 'submitted' && project.submission ? (
                    <div className="submitted-note">
                      Submitted &ldquo;{project.submission.title}&rdquo; on {formatDateTime(project.submission.submittedAt)}. Waiting on the admin.
                    </div>
                  ) : null}

                  {project.status === 'approved' && project.submission ? (
                    <div className="approved-note">
                      Approved. &ldquo;{project.submission.title}&rdquo; is now visible to the client.
                    </div>
                  ) : null}

                  <div className="card-actions">
                    {project.status === 'assigned' ? (
                      <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => this.handleStart(project._id)}>
                        {isBusy ? 'Starting...' : 'Start Work'}
                      </button>
                    ) : null}

                    {project.status === 'in-progress' ? (
                      <button type="button" className="btn btn-secondary" onClick={() => this.setState(prev => ({ openFormId: prev.openFormId === project._id ? '' : project._id }))}>
                        {openFormId === project._id ? 'Close' : 'Submit Design'}
                      </button>
                    ) : null}
                  </div>

                  {openFormId === project._id ? (
                    <form className="submit-form" onSubmit={(event) => this.handleSubmitDesign(event, project._id)}>
                      <div className="form-group">
                        <label htmlFor={`st-${project._id}`}>Design Title</label>
                        <input id={`st-${project._id}`} value={draft.title} onChange={(e) => this.handleDraftChange(project._id, 'title', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`si-${project._id}`}>Image URL</label>
                        <input id={`si-${project._id}`} value={draft.imageUrl} onChange={(e) => this.handleDraftChange(project._id, 'imageUrl', e.target.value)} placeholder="https://example.com/design.jpg" />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`sd-${project._id}`}>Description</label>
                        <textarea id={`sd-${project._id}`} value={draft.description} onChange={(e) => this.handleDraftChange(project._id, 'description', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`sn-${project._id}`}>Notes for the admin (optional)</label>
                        <input id={`sn-${project._id}`} value={draft.notes} onChange={(e) => this.handleDraftChange(project._id, 'notes', e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-primary" disabled={isBusy}>
                        {isBusy ? 'Sending...' : 'Send for Approval'}
                      </button>
                    </form>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  }
}

export default DesignerProjects;
