import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import DesignerProjects from '../components/DesignerProjects';
import {
  getAllDesigners,
  getMyDesigns,
  getProfile,
  createDesign,
  deleteDesign,
  uploadProfileImage
} from '../services/api';
import './Dashboard.css';

class DashboardViewModel {
  static getAvatarUrl(profileImage, fallbackName) {
    if (profileImage) return profileImage;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName || 'User')}&background=667eea&color=fff`;
  }
}

const initialDesignForm = {
  title: '',
  description: '',
  surfaceType: 'living-room',
  category: 'modern',
  materials: '',
  cost: '',
  duration: '',
  imageUrl: '',
  isPortfolio: true
};

const formatDateTime = (value) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      designers: [],
      portfolioItems: [],
      availability: [],
      selectedAvailabilitySlot: '',
      designForm: initialDesignForm,
      feedback: { type: '', message: '' },
      loading: true,
      savingDesign: false,
      uploadingImage: false
    };
  }

  componentDidMount() {
    this.loadDashboardData();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.user?.id !== this.props.user?.id || prevProps.user?.role !== this.props.user?.role) {
      this.loadDashboardData();
    }
  }

  loadDashboardData = async () => {
    const { user } = this.props;
    this.setState({ loading: true, feedback: { type: '', message: '' } });
    try {
      if (user.role === 'designer') {
        const [profileRes, designsRes] = await Promise.all([getProfile(), getMyDesigns()]);
        this.setState({ availability: profileRes.data.user.availability || [], portfolioItems: designsRes.data.designs || [] });
        return;
      }

      const designersRes = await getAllDesigners();
      this.setState({ designers: designersRes.data.designers || [] });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      this.setState({ feedback: { type: 'error', message: 'Unable to load the latest dashboard data right now.' } });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleDesignChange = (event) => {
    const { name, value, type, checked } = event.target;
    this.setState(prev => ({ designForm: { ...prev.designForm, [name]: type === 'checkbox' ? checked : value } }));
  };

  handleCreateDesign = async (event) => {
    event.preventDefault();
    this.setState({ savingDesign: true, feedback: { type: '', message: '' } });
    try {
      const response = await createDesign(this.state.designForm);
      const nextDesign = response.data.design;
      this.setState(prev => ({ portfolioItems: [nextDesign, ...prev.portfolioItems], designForm: initialDesignForm, feedback: { type: 'success', message: 'Design posted successfully. It is now available in your portfolio.' } }));
    } catch (err) {
      console.error('Error creating design:', err);
      this.setState({ feedback: { type: 'error', message: err.response?.data?.message || 'Unable to post the design right now.' } });
    } finally {
      this.setState({ savingDesign: false });
    }
  };

  handleDeleteDesign = async (designId) => {
    const shouldDelete = window.confirm('Delete this design from your portfolio?');
    if (!shouldDelete) return;
    try {
      await deleteDesign(designId);
      this.setState(prev => ({ portfolioItems: prev.portfolioItems.filter(item => item._id !== designId), feedback: { type: 'success', message: 'Design removed successfully.' } }));
    } catch (err) {
      console.error('Error deleting design:', err);
      this.setState({ feedback: { type: 'error', message: err.response?.data?.message || 'Unable to delete this design.' } });
    }
  };

  handleProfileImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    this.setState({ uploadingImage: true, feedback: { type: '', message: '' } });
    try {
      const response = await uploadProfileImage(file);
      const updatedUser = response.data.user || response.data;
      if (updatedUser) {
        const nextUser = { ...this.props.user, profileImage: updatedUser.profileImage };
        localStorage.setItem('user', JSON.stringify(nextUser));
        window.location.reload();
      }
    } catch (err) {
      console.error('Error uploading profile image:', err);
      this.setState({ feedback: { type: 'error', message: err.response?.data?.message || 'Unable to upload your profile picture right now.' } });
    } finally {
      this.setState({ uploadingImage: false });
    }
  };

  render() {
    const { user } = this.props;
    const { designers, portfolioItems, availability, selectedAvailabilitySlot, designForm, feedback, loading, savingDesign, uploadingImage } = this.state;

    if (loading) return <div className="loading">Loading dashboard...</div>;

    if (user.role === 'designer') {
      return (
        <div className="dashboard">
          <div className="dashboard-header designer-header">
            <div className="dashboard-user-summary">
              <label className="dashboard-user-avatar-upload">
                <img src={DashboardViewModel.getAvatarUrl(user.profileImage, user.name)} alt={user.name} className="dashboard-user-avatar" />
                <input type="file" accept="image/*" onChange={this.handleProfileImageUpload} />
                <span>{uploadingImage ? 'Uploading...' : 'Choose photo'}</span>
              </label>
              <div>
                <h1>{user.name}, manage your studio</h1>
                <p>Publish fresh portfolio work, open booking slots, and keep your calendar ready for new clients.</p>
              </div>
            </div>
            <div className="header-stats">
              <div className="stat-card">
                <strong>{portfolioItems.length}</strong>
                <span>Design posts</span>
              </div>
              <div className="stat-card">
                <strong>{availability.length}</strong>
                <span>Open slots</span>
              </div>
              <div className="stat-card">
                <strong>{availability[0] ? formatDateTime(availability[0]) : 'None yet'}</strong>
                <span>Next available</span>
              </div>
            </div>
          </div>

          {feedback.message ? (<div className={`dashboard-alert ${feedback.type}`}>{feedback.message}</div>) : null}

          <div className="dashboard-layout">
            <section className="dashboard-section composer-section">
              <div className="section-header">
                <div>
                  <h2>Post a Design</h2>
                  <p>Share the projects you want clients to discover on the website.</p>
                </div>
                <Link to="/appointments" className="btn btn-secondary">View Appointments</Link>
              </div>

              <form className="design-form" onSubmit={this.handleCreateDesign}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="title">Design Title</label>
                    <input id="title" name="title" value={designForm.title} onChange={this.handleDesignChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="imageUrl">Image URL</label>
                    <input id="imageUrl" name="imageUrl" value={designForm.imageUrl} onChange={this.handleDesignChange} placeholder="https://example.com/design.jpg" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="surfaceType">Room / Surface</label>
                    <select id="surfaceType" name="surfaceType" value={designForm.surfaceType} onChange={this.handleDesignChange}>
                      <option value="living-room">Living Room</option>
                      <option value="bedroom">Bedroom</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="bathroom">Bathroom</option>
                      <option value="dining-room">Dining Room</option>
                      <option value="office">Office</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="category">Style Category</label>
                    <select id="category" name="category" value={designForm.category} onChange={this.handleDesignChange}>
                      <option value="modern">Modern</option>
                      <option value="traditional">Traditional</option>
                      <option value="contemporary">Contemporary</option>
                      <option value="minimalist">Minimalist</option>
                      <option value="industrial">Industrial</option>
                      <option value="rustic">Rustic</option>
                      <option value="eclectic">Eclectic</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cost">Estimated Cost</label>
                    <input id="cost" name="cost" type="number" min="0" value={designForm.cost} onChange={this.handleDesignChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="duration">Project Duration</label>
                    <input id="duration" name="duration" value={designForm.duration} onChange={this.handleDesignChange} placeholder="6 weeks" />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="materials">Materials</label>
                    <input id="materials" name="materials" value={designForm.materials} onChange={this.handleDesignChange} placeholder="Wood, matte paint, brass fixtures" />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="description">Description</label>
                    <textarea id="description" name="description" value={designForm.description} onChange={this.handleDesignChange} placeholder="Describe the concept, mood, and key design decisions." required />
                  </div>
                </div>

                <label className="checkbox-row">
                  <input type="checkbox" name="isPortfolio" checked={designForm.isPortfolio} onChange={this.handleDesignChange} />
                  <span>Show this design in the public portfolio</span>
                </label>

                <button type="submit" className="btn btn-primary" disabled={savingDesign}>{savingDesign ? 'Posting...' : 'Post Design'}</button>
              </form>
            </section>

            <section className="dashboard-section availability-section">
              <div className="section-header"><div><h2>Your Booking Schedule</h2><p>The studio admin opens your booking dates. These are the ones clients can see right now.</p></div></div>

              <div className="schedule-note">
                <p>Need different dates? Ask the studio admin to open or close them for you.</p>
              </div>

              <AvailabilityCalendar slots={availability} selectedSlot={selectedAvailabilitySlot} onSelectSlot={(v) => this.setState({ selectedAvailabilitySlot: v })} emptyMessage="The studio admin has not opened any booking dates for you yet." />
            </section>
          </div>

          <section className="dashboard-section">
            <div className="section-header"><div><h2>Assigned Projects</h2><p>Work the studio admin has assigned to you. Start it, then send the finished design for approval.</p></div></div>
            <DesignerProjects />
          </section>

          <section className="dashboard-section">
            <div className="section-header"><div><h2>Your Portfolio Posts</h2><p>Everything you publish here can help clients decide to book you.</p></div></div>

            {portfolioItems.length > 0 ? (
              <div className="designs-grid">
                {portfolioItems.map(design => (
                  <article key={design._id} className="design-card">
                    {design.imageUrl ? (<img src={design.imageUrl} alt={design.title} className="design-image" />) : (<div className="design-image placeholder">No image provided</div>)}
                    <div className="design-card-body">
                      <div className="design-header"><h3>{design.title}</h3><span className={`status ${design.isPortfolio ? 'portfolio' : 'private'}`}>{design.isPortfolio ? 'Public' : 'Private'}</span></div>
                      <p className="surface-type">{design.surfaceType}</p>
                      <p className="category">Category: {design.category || 'Not specified'}</p>
                      <p className="design-description">{design.description}</p>
                      {design.materials?.length ? (<p className="design-meta">Materials: {design.materials.join(', ')}</p>) : null}
                      {design.duration ? (<p className="design-meta">Duration: {design.duration}</p>) : null}
                      <p className="cost">Rs. {design.cost || 0}</p>
                      <div className="card-actions"><button type="button" className="btn btn-danger" onClick={() => this.handleDeleteDesign(design._id)}>Delete</button></div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p>No designs posted yet. Add your first project above and it will appear here.</p></div>
            )}
          </section>
        </div>
      );
    }

    return (
      <div className="dashboard">
        <div className="dashboard-header"><h1>Hello {user.name}</h1><p>Browse active designers, see who has open booking dates, and choose the right studio for your project.</p></div>

        <div className="action-buttons"><Link to="/projects" className="btn btn-primary">Request a Design</Link><Link to="/appointments" className="btn btn-secondary">My Appointments</Link><Link to="/portfolio" className="btn btn-secondary">Browse Portfolio</Link></div>

        {feedback.message ? (<div className={`dashboard-alert ${feedback.type}`}>{feedback.message}</div>) : null}

        <div className="dashboard-section">
          <div className="section-header"><div><h2>Featured Designers</h2><p>Open a designer profile to browse their designs and book from their live calendar.</p></div></div>

          {designers.length > 0 ? (
            <div className="designers-grid">
              {designers.slice(0, 6).map(designer => (
                <article key={designer._id} className="designer-card">
                  <img src={DashboardViewModel.getAvatarUrl(designer.profileImage, designer.name)} alt={designer.name} className="designer-avatar-image" />
                  <div className="designer-info">
                    <div className="designer-meta-row"><h3>{designer.name}</h3><span className="availability-badge">{designer.availability?.length || 0} open slot{designer.availability?.length === 1 ? '' : 's'}</span></div>
                    {designer.specialization ? (<p className="specialization">{designer.specialization}</p>) : null}
                    {designer.experience ? (<p className="experience">{designer.experience} years experience</p>) : null}
                    {designer.address?.city ? (<p className="location">{designer.address.city}, {designer.address.state}</p>) : null}
                    <Link to={`/designer/${designer._id}`} className="btn btn-primary">View Profile and Book</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No designers are available at the moment.</p></div>
          )}
        </div>
      </div>
    );
  }
}

export default Dashboard;
