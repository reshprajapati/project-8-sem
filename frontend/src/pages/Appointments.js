import React, { Component } from 'react';
import {
  cancelAppointment,
  getAppointments,
  setFieldVisitTime
} from '../services/api';
import './Appointments.css';

const formatDateTime = (value) => {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const toDateTimeInputValue = (value) => {
  const date = new Date(value);
  const pad = (input) => String(input).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

class Appointments extends Component {
  constructor(props) {
    super(props);
    this.state = { appointments: [], visitTimes: {}, feedback: { type: '', message: '' }, loading: true };
  }

  componentDidMount() {
    this.fetchAppointments();
  }

  fetchAppointments = async () => {
    try {
      const response = await getAppointments();
      this.setState({ appointments: response.data.appointments || [] });
    } catch (err) {
      console.error('Error fetching appointments:', err);
      this.setState({ feedback: { type: 'error', message: 'Unable to load appointments right now.' } });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleCancel = async (appointmentId) => {
    try {
      await cancelAppointment(appointmentId);
      this.setState({ feedback: { type: 'success', message: 'Appointment cancelled successfully.' } });
      await this.fetchAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      this.setState({ feedback: { type: 'error', message: err.response?.data?.message || 'Unable to cancel this appointment.' } });
    }
  };

  handleVisitTimeChange = (appointmentId, value) => {
    this.setState(prev => ({ visitTimes: { ...prev.visitTimes, [appointmentId]: value } }));
  };

  handleSetVisitTime = async (appointmentId) => {
    const selectedValue = this.state.visitTimes[appointmentId];
    if (!selectedValue) {
      this.setState({ feedback: { type: 'error', message: 'Choose a visit time before confirming the appointment.' } });
      return;
    }

    try {
      await setFieldVisitTime(appointmentId, { fieldVisitTime: new Date(selectedValue).toISOString() });
      this.setState({ feedback: { type: 'success', message: 'Field visit time confirmed successfully.' } });
      await this.fetchAppointments();
    } catch (err) {
      console.error('Error setting field visit time:', err);
      this.setState({ feedback: { type: 'error', message: err.response?.data?.message || 'Unable to confirm the visit time.' } });
    }
  };

  render() {
    const { user } = this.props;
    const { appointments, visitTimes, feedback, loading } = this.state;

    if (loading) {
      return <div className="loading">Loading appointments...</div>;
    }

    return (
      <div className="appointments-page">
        <div className="page-header">
          <h1>Appointments</h1>
          <p>Track consultations, manage field visits, and keep every booking in one place.</p>
        </div>

        {feedback.message ? (
          <div className={`appointments-alert ${feedback.type}`}>{feedback.message}</div>
        ) : null}

        {appointments.length > 0 ? (
          <div className="appointments-list">
            {appointments.map(apt => (
              <article key={apt._id} className="appointment-item">
                <div className="apt-header">
                  <div>
                    <h3>{user.role === 'designer' ? apt.userId?.name : apt.designerId?.name}</h3>
                    {apt.designTitle ? (
                      <p className="apt-design">Requested design: {apt.designTitle}</p>
                    ) : null}
                  </div>
                  <span className={`status ${apt.status}`}>{apt.status}</span>
                </div>

                <p className="apt-location">
                  Location: {apt.location.street}, {apt.location.city}, {apt.location.state}, {apt.location.zipCode}, {apt.location.country}
                </p>
                <p className="apt-surface">Project type: {apt.surfaceArea}</p>
                <p className="apt-time">Consultation: {formatDateTime(apt.appointmentTime)}</p>
                {apt.fieldVisitTime ? (
                  <p className="apt-visit">Field visit: {formatDateTime(apt.fieldVisitTime)}</p>
                ) : null}
                {apt.budget > 0 ? (
                  <p className="apt-budget">Budget: Rs. {apt.budget}</p>
                ) : null}
                {apt.description ? (
                  <p className="apt-description">{apt.description}</p>
                ) : null}

                <div className="appointment-actions">
                  {user.role === 'designer' && apt.status !== 'cancelled' ? (
                    <div className="visit-scheduler">
                      <input
                        type="datetime-local"
                        value={visitTimes[apt._id] || ''}
                        min={toDateTimeInputValue(new Date())}
                        onChange={(event) => this.handleVisitTimeChange(apt._id, event.target.value)}
                      />
                      <button type="button" className="btn btn-secondary" onClick={() => this.handleSetVisitTime(apt._id)}>
                        Confirm Visit
                      </button>
                    </div>
                  ) : null}

                  {apt.status !== 'cancelled' ? (
                    <button type="button" className="btn btn-danger" onClick={() => this.handleCancel(apt._id)}>
                      Cancel Appointment
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No appointments yet.</p>
          </div>
        )}
      </div>
    );
  }
}

export default Appointments;
