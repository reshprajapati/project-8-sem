import React, { Component } from 'react';
import { useParams } from 'react-router-dom';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import {
  createAppointment,
  createCoverageRequest,
  getDesignerDesigns,
  getDesignerSchedule,
  getUserProfile
} from '../services/api';
import './DesignerProfile.css';

const initialBookingForm = {
  surfaceArea: 'living-room',
  budget: '',
  description: '',
  location: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  }
};

const formatDateTime = (value) => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

const formatDate = (value) => new Date(value).toLocaleDateString([], { dateStyle: 'full' });

const loadDesignerBundle = async (designerId) => {
  const [designerRes, designsRes, scheduleRes] = await Promise.all([
    getUserProfile(designerId),
    getDesignerDesigns(designerId),
    getDesignerSchedule(designerId)
  ]);

  return {
    designer: designerRes.data.user,
    designs: designsRes.data.designs || [],
    packedDates: scheduleRes.data.schedule?.packedDates || []
  };
};

class DesignerProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      designer: null,
      designs: [],
      packedDates: [],
      selectedDesign: null,
      selectedSlot: '',
      selectedPackedDate: '',
      bookingForm: initialBookingForm,
      bookingState: { type: '', message: '' },
      loading: true,
      submitting: false
    };
  }

  async componentDidMount() {
    await this.loadBundle();
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.params?.id !== this.props.params?.id) {
      await this.loadBundle();
    }
  }

  loadBundle = async () => {
    const id = this.props.params.id;
    try {
      const bundle = await loadDesignerBundle(id);
      this.setState({
        designer: bundle.designer,
        designs: bundle.designs,
        packedDates: bundle.packedDates,
        loading: false
      });
    } catch (err) {
      console.error('Error fetching designer data:', err);
      this.setState({ bookingState: { type: 'error', message: 'Unable to load this designer profile right now.' }, loading: false });
    }
  };

  handleBookingFieldChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith('location.')) {
      const locationKey = name.split('.')[1];
      this.setState(prev => ({ bookingForm: { ...prev.bookingForm, location: { ...prev.bookingForm.location, [locationKey]: value } } }));
      return;
    }

    this.setState(prev => ({ bookingForm: { ...prev.bookingForm, [name]: value } }));
  };

  handleSelectDesign = (design) => {
    this.setState(prev => ({ selectedDesign: design, bookingForm: { ...prev.bookingForm, description: prev.bookingForm.description || `I would like to discuss a project inspired by "${design.title}".` } }));
  };

  // Choosing a packed day clears any open slot: the two are different requests.
  handleSelectPackedDay = (dateKey) => {
    this.setState({
      selectedPackedDate: dateKey,
      selectedSlot: '',
      bookingState: { type: '', message: '' }
    });
  };

  handleSelectSlot = (slot) => {
    this.setState({ selectedSlot: slot, selectedPackedDate: '' });
  };

  handleBookAppointment = async (event) => {
    event.preventDefault();
    const id = this.props.params.id;
    const { selectedSlot, selectedPackedDate, bookingForm, selectedDesign } = this.state;

    if (!selectedSlot && !selectedPackedDate) {
      this.setState({ bookingState: { type: 'error', message: 'Please choose a date from the calendar.' } });
      return;
    }

    this.setState({ submitting: true, bookingState: { type: '', message: '' } });

    const sharedDetails = {
      designerId: id,
      location: bookingForm.location,
      surfaceArea: bookingForm.surfaceArea,
      budget: bookingForm.budget,
      description: bookingForm.description,
      designId: selectedDesign?._id,
      designTitle: selectedDesign?.title
    };

    try {
      let message;

      if (selectedPackedDate) {
        // Fully booked day: goes to the studio admin, who appoints a
        // covering designer instead of creating the booking directly.
        const response = await createCoverageRequest({
          ...sharedDetails,
          requestedDate: new Date(`${selectedPackedDate}T09:00`).toISOString()
        });
        message = response.data.message;
      } else {
        await createAppointment({ ...sharedDetails, appointmentTime: selectedSlot });
        message = `Appointment requested for ${formatDateTime(selectedSlot)}.`;
      }

      this.setState({
        bookingState: { type: 'success', message },
        selectedSlot: '',
        selectedPackedDate: '',
        selectedDesign: null,
        bookingForm: initialBookingForm
      });

      const bundle = await loadDesignerBundle(id);
      this.setState({
        designer: bundle.designer,
        designs: bundle.designs,
        packedDates: bundle.packedDates
      });
    } catch (err) {
      console.error('Error submitting booking:', err);
      this.setState({ bookingState: { type: 'error', message: err.response?.data?.message || 'Unable to submit your booking right now.' } });
    } finally {
      this.setState({ submitting: false });
    }
  };

  render() {
    const { currentUser } = this.props;
    const { designer, designs, packedDates, selectedDesign, selectedSlot, selectedPackedDate, bookingForm, bookingState, loading, submitting } = this.state;

    if (loading) {
      return <div className="loading">Loading designer profile...</div>;
    }

    if (!designer) {
      return <div className="error">Designer not found.</div>;
    }

    const canBook = currentUser?.role === 'user';
    const availableSlots = designer.availability || [];
    const isCoverageRequest = Boolean(selectedPackedDate);

    return (
      <div className="designer-profile">
        <section className="profile-header">
          {designer.profileImage ? (
            <img src={designer.profileImage} alt={designer.name} className="profile-image" />
          ) : (
            <div className="profile-image-placeholder">{designer.name.charAt(0).toUpperCase()}</div>
          )}

          <div className="profile-info">
            <div className="profile-title-row">
              <div>
                <h1>{designer.name}</h1>
                {designer.specialization ? (
                  <p className="specialization">{designer.specialization}</p>
                ) : null}
              </div>
              <span className="open-slot-badge">{availableSlots.length} open slot{availableSlots.length === 1 ? '' : 's'}</span>
            </div>

            {designer.experience ? <p className="experience">{designer.experience} years of experience</p> : null}
            {designer.address?.city ? <p className="location">{designer.address.city}, {designer.address.state}</p> : null}
            {designer.bio ? <p className="bio">{designer.bio}</p> : <p className="bio muted">This designer has not added a bio yet.</p>}
          </div>
        </section>

        {designer.socialLinks && (
          <section className="social-links">
            {designer.socialLinks.website ? <a href={designer.socialLinks.website} target="_blank" rel="noopener noreferrer">Website</a> : null}
            {designer.socialLinks.instagram ? <a href={designer.socialLinks.instagram} target="_blank" rel="noopener noreferrer">Instagram</a> : null}
            {designer.socialLinks.facebook ? <a href={designer.socialLinks.facebook} target="_blank" rel="noopener noreferrer">Facebook</a> : null}
            {designer.socialLinks.linkedin ? <a href={designer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a> : null}
          </section>
        )}

        {bookingState.message ? (<div className={`booking-alert ${bookingState.type}`}>{bookingState.message}</div>) : null}

        <div className="profile-layout">
          <section className="portfolio-section">
            <div className="section-heading">
              <div>
                <h2>Designer Portfolio</h2>
                <p>Browse the live work this designer has published to the website.</p>
              </div>
            </div>

            {designs.length > 0 ? (
              <div className="designs-grid">
                {designs.map(design => (
                  <article key={design._id} className={`design-item ${selectedDesign?._id === design._id ? 'selected' : ''}`}>
                    {design.imageUrl ? <img src={design.imageUrl} alt={design.title} className="design-cover" /> : <div className="design-cover placeholder">Portfolio preview</div>}
                    <div className="design-body">
                      <div className="design-headline"><h3>{design.title}</h3>{design.category ? <span className="category">{design.category}</span> : null}</div>
                      <p className="surface">{design.surfaceType}</p>
                      <p className="design-description">{design.description}</p>
                      {design.materials?.length ? <p className="design-meta">Materials: {design.materials.join(', ')}</p> : null}
                      {design.duration ? <p className="design-meta">Duration: {design.duration}</p> : null}
                      <p className="cost">Rs. {design.cost || 0}</p>
                      {canBook ? <button type="button" className="btn btn-secondary" onClick={() => this.handleSelectDesign(design)}>{selectedDesign?._id === design._id ? 'Selected for Booking' : 'Book This Style'}</button> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No public portfolio items have been posted yet.</p>
              </div>
            )}
          </section>

          <section className="booking-section">
            <div className="section-heading">
              <div>
                <h2>{canBook ? 'Book From Available Dates' : 'Availability Calendar'}</h2>
                <p>{canBook ? 'Pick an open time, or choose a packed date and the studio admin will appoint another designer for you.' : 'Only clients can book appointments, but you can still review this public schedule.'}</p>
              </div>
            </div>

            {selectedDesign ? (<div className="selected-design-card"><span>Selected design</span><strong>{selectedDesign.title}</strong></div>) : null}

            <AvailabilityCalendar
              slots={availableSlots}
              packedDates={packedDates}
              selectedSlot={selectedSlot}
              onSelectSlot={canBook ? this.handleSelectSlot : undefined}
              onSelectPackedDay={canBook ? this.handleSelectPackedDay : undefined}
              emptyMessage="The studio admin has not opened any booking dates for this designer yet."
            />

            {selectedSlot ? <div className="selected-slot-banner">Selected slot: <strong>{formatDateTime(selectedSlot)}</strong></div> : null}

            {isCoverageRequest ? (
              <div className="selected-slot-banner coverage">
                Fully booked on <strong>{formatDate(selectedPackedDate)}</strong>. The studio admin will appoint an available designer for this date.
              </div>
            ) : null}

            {canBook ? (
              <form className="booking-form" onSubmit={this.handleBookAppointment}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="surfaceArea">Project Type</label>
                    <select id="surfaceArea" name="surfaceArea" value={bookingForm.surfaceArea} onChange={this.handleBookingFieldChange}>
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
                    <label htmlFor="budget">Budget</label>
                    <input id="budget" name="budget" type="number" min="0" value={bookingForm.budget} onChange={this.handleBookingFieldChange} placeholder="250000" />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="description">Project Brief</label>
                    <textarea id="description" name="description" value={bookingForm.description} onChange={this.handleBookingFieldChange} placeholder="Tell the designer what kind of space and mood you want." />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location.street">Street Address</label>
                    <input id="location.street" name="location.street" value={bookingForm.location.street} onChange={this.handleBookingFieldChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location.city">City</label>
                    <input id="location.city" name="location.city" value={bookingForm.location.city} onChange={this.handleBookingFieldChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location.state">State</label>
                    <input id="location.state" name="location.state" value={bookingForm.location.state} onChange={this.handleBookingFieldChange} required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location.zipCode">ZIP Code</label>
                    <input id="location.zipCode" name="location.zipCode" value={bookingForm.location.zipCode} onChange={this.handleBookingFieldChange} required />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="location.country">Country</label>
                    <input id="location.country" name="location.country" value={bookingForm.location.country} onChange={this.handleBookingFieldChange} required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting
                    ? 'Sending Request...'
                    : (isCoverageRequest ? 'Request a Designer for This Date' : 'Book Appointment')}
                </button>
              </form>
            ) : (
              <div className="booking-note"><p>Switch to a client account to book from this designer's calendar.</p></div>
            )}
          </section>
        </div>
      </div>
    );
  }
}

export default function DesignerProfileWithParams(props) {
  const params = useParams();
  return <DesignerProfile {...props} params={params} />;
}
