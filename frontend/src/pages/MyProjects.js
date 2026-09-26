import React, { Component } from 'react';
import ProjectStatusBadge, { PROJECT_STATUS_HINTS } from '../components/ProjectStatusBadge';
import { cancelProject, createProject, getMyProjects } from '../services/api';
import './MyProjects.css';

const initialForm = {
  title: '',
  description: '',
  surfaceArea: 'living-room',
  budget: '',
  location: { street: '', city: '', state: '', zipCode: '', country: '' }
};

const formatDateTime = (value) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

const ROOM_TYPES = [
  ['living-room', 'Living Room'],
  ['bedroom', 'Bedroom'],
  ['kitchen', 'Kitchen'],
  ['bathroom', 'Bathroom'],
  ['dining-room', 'Dining Room'],
  ['office', 'Office'],
  ['other', 'Other']
];

class MyProjects extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      form: initialForm,
      feedback: { type: '', message: '' },
      loading: true,
      submitting: false,
      showForm: false
    };
  }

  componentDidMount() {
    this.loadProjects();
  }

  loadProjects = async () => {
    try {
      const response = await getMyProjects();
      this.setState({ projects: response.data.projects || [] });
    } catch (err) {
      console.error('Error loading projects:', err);
      this.setState({ feedback: { type: 'error', message: 'Unable to load your projects right now.' } });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith('location.')) {
      const key = name.split('.')[1];
      this.setState(prev => ({ form: { ...prev.form, location: { ...prev.form.location, [key]: value } } }));
      return;
    }

    this.setState(prev => ({ form: { ...prev.form, [name]: value } }));
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({ submitting: true, feedback: { type: '', message: '' } });

    try {
      const response = await createProject(this.state.form);
      this.setState({ form: initialForm, showForm: false, feedback: { type: 'success', message: response.data.message } });
      await this.loadProjects();
    } catch (err) {
      console.error('Error submitting project:', err);
      this.setState({ feedback: { type: 'error', message: err.response?.data?.message || 'Unable to submit your request.' } });
    } finally {
      this.setState({ submitting: false });
    }
  };

  handleCancel = async (projectId) => {
    const confirmed = window.confirm('Cancel this project request?');
    if (!confirmed) return;

    try {
      await cancelProject(projectId);
      this.setState({ feedback: { type: 'success', message: 'Project cancelled.' } });
      await this.loadProjects();
    } catch (err) {
      console.error('Error cancelling project:', err);
      this.setState({ feedback: { type: 'error', message: err.response?.data?.message || 'Unable to cancel this project.' } });
    }
  };

  render() {
    const { projects, form, feedback, loading, submitting, showForm } = this.state;

    if (loading) return <div className="loading">Loading your projects...</div>;

    const approved = projects.filter(project => project.status === 'approved');

    return (
      <div className="my-projects">
        <div className="page-header">
          <div>
            <h1>My Projects</h1>
            <p>Send a request to the studio. An admin assigns a designer, and your finished design appears here once it is approved.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => this.setState(prev => ({ showForm: !prev.showForm }))}>
            {showForm ? 'Close' : 'Request a Design'}
          </button>
        </div>

        {feedback.message ? <div className={`projects-alert ${feedback.type}`}>{feedback.message}</div> : null}

        {showForm ? (
          <section className="project-form-section">
            <h2>Tell us about your space</h2>
            <form className="project-form" onSubmit={this.handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="title">Project Title</label>
                  <input id="title" name="title" value={form.title} onChange={this.handleChange} placeholder="Lakeside bedroom refresh" required />
                </div>
                <div className="form-group">
                  <label htmlFor="surfaceArea">Room Type</label>
                  <select id="surfaceArea" name="surfaceArea" value={form.surfaceArea} onChange={this.handleChange}>
                    {ROOM_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="budget">Budget</label>
                  <input id="budget" name="budget" type="number" min="0" value={form.budget} onChange={this.handleChange} placeholder="150000" />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="description">What do you want?</label>
                  <textarea id="description" name="description" value={form.description} onChange={this.handleChange} placeholder="Describe the space, the mood you want, and anything that must stay." required />
                </div>
                <div className="form-group">
                  <label htmlFor="location.street">Street Address</label>
                  <input id="location.street" name="location.street" value={form.location.street} onChange={this.handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="location.city">City</label>
                  <input id="location.city" name="location.city" value={form.location.city} onChange={this.handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="location.state">State</label>
                  <input id="location.state" name="location.state" value={form.location.state} onChange={this.handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="location.zipCode">ZIP Code</label>
                  <input id="location.zipCode" name="location.zipCode" value={form.location.zipCode} onChange={this.handleChange} required />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="location.country">Country</label>
                  <input id="location.country" name="location.country" value={form.location.country} onChange={this.handleChange} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Sending...' : 'Submit Request'}
              </button>
            </form>
          </section>
        ) : null}

        {approved.length > 0 ? (
          <section className="approved-section">
            <h2>Your Approved Designs</h2>
            <div className="approved-grid">
              {approved.map(project => (
                <article key={project._id} className="approved-card">
                  {project.submission?.imageUrl ? (
                    <img src={project.submission.imageUrl} alt={project.submission.title} className="approved-image" />
                  ) : (
                    <div className="approved-image placeholder">Design preview</div>
                  )}
                  <div className="approved-body">
                    <h3>{project.submission?.title || project.title}</h3>
                    <p className="approved-designer">by {project.designer?.name || 'your designer'}</p>
                    <p className="approved-description">{project.submission?.description}</p>
                    {project.submission?.notes ? <p className="approved-notes">{project.submission.notes}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="tracker-section">
          <h2>All Requests</h2>

          {projects.length === 0 ? (
            <div className="empty-state">
              <p>You have not requested a design yet. Use the button above to send your first one.</p>
            </div>
          ) : (
            <div className="project-list">
              {projects.map(project => (
                <article key={project._id} className="project-row">
                  <div className="project-row-head">
                    <div>
                      <h3>{project.title}</h3>
                      <p className="project-room">{project.surfaceArea} &middot; requested {formatDateTime(project.createdAt)}</p>
                    </div>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <p className="project-hint">{PROJECT_STATUS_HINTS[project.status]}</p>

                  {project.designer ? (
                    <p className="project-detail">Designer: <strong>{project.designer.name}</strong>{project.designer.specialization ? ` — ${project.designer.specialization}` : ''}</p>
                  ) : null}
                  {project.scheduledAt ? (
                    <p className="project-detail">Scheduled: <strong>{formatDateTime(project.scheduledAt)}</strong></p>
                  ) : null}
                  {project.budget > 0 ? <p className="project-detail">Budget: Rs. {project.budget}</p> : null}

                  {['requested', 'assigned'].includes(project.status) ? (
                    <div className="card-actions">
                      <button type="button" className="btn btn-danger" onClick={() => this.handleCancel(project._id)}>
                        Cancel Request
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }
}

export default MyProjects;
