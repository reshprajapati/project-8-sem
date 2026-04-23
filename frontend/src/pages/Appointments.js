import React, { useState, useEffect } from 'react';
import { getAppointments } from '../services/api';
import './Appointments.css';

const Appointments = ({ user }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await getAppointments();
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading appointments...</div>;
  }

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1>Appointments</h1>
        <p>Manage your appointments and site visits</p>
      </div>

      {appointments.length > 0 ? (
        <div className="appointments-list">
          {appointments.map(apt => (
            <div key={apt._id} className="appointment-item">
              <div className="apt-header">
                <h3>{user.role === 'designer' ? apt.userId.name : apt.designerId.name}</h3>
                <span className={`status ${apt.status}`}>{apt.status}</span>
              </div>
              <p className="apt-location">📍 {apt.location.city}, {apt.location.street}</p>
              <p className="apt-surface">Surface: {apt.surfaceArea}</p>
              <p className="apt-time">📅 {new Date(apt.appointmentTime).toLocaleDateString()}</p>
              {apt.fieldVisitTime && (
                <p className="apt-visit">🚗 Field Visit: {new Date(apt.fieldVisitTime).toLocaleDateString()}</p>
              )}
              {apt.budget > 0 && <p className="apt-budget">Budget: ₹{apt.budget}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No appointments yet</p>
        </div>
      )}
    </div>
  );
};

export default Appointments;
