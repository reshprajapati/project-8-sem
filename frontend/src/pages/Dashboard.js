import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDesigns, getAllDesigners } from '../services/api';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [designers, setDesigners] = useState([]);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (user.role === 'designer') {
        // Fetch portfolio items for designer
        const designsRes = await getDesigns({ designerId: user.id });
        setPortfolioItems(designsRes.data.designs);
      } else {
        // Fetch designers for user
        const designersRes = await getAllDesigners();
        setDesigners(designersRes.data.designers);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      {user.role === 'designer' ? (
        <>
          <div className="dashboard-header">
            <h1>Welcome back, {user.name}!</h1>
            <p>This is your design portfolio and management dashboard</p>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Your Designs</h2>
              <Link to="/appointments" className="btn btn-primary">View Appointments</Link>
            </div>

            {portfolioItems.length > 0 ? (
              <div className="designs-grid">
                {portfolioItems.map(design => (
                  <div key={design._id} className="design-card">
                    <div className="design-header">
                      <h3>{design.title}</h3>
                      <span className={`status ${design.isPortfolio ? 'portfolio' : 'private'}`}>
                        {design.isPortfolio ? 'Portfolio' : 'Private'}
                      </span>
                    </div>
                    <p className="surface-type">{design.surfaceType}</p>
                    <p className="category">Category: {design.category}</p>
                    {design.clientReview && (
                      <div className="review">
                        <span className="rating">⭐ {design.clientReview.rating}/5</span>
                        <p>{design.clientReview.comment}</p>
                      </div>
                    )}
                    <p className="cost">₹{design.cost}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No designs yet. Create your first design!</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="dashboard-header">
            <h1>Hello {user.name}!</h1>
            <p>Find the perfect designer for your next project</p>
          </div>

          <div className="action-buttons">
            <Link to="/appointments" className="btn btn-primary">My Appointments</Link>
            <Link to="/portfolio" className="btn btn-secondary">Browse Portfolio</Link>
          </div>

          <div className="dashboard-section">
            <h2>Featured Designers</h2>
            {designers.length > 0 ? (
              <div className="designers-grid">
                {designers.slice(0, 6).map(designer => (
                  <div key={designer._id} className="designer-card">
                    {designer.profileImage && (
                      <img src={designer.profileImage} alt={designer.name} />
                    )}
                    <div className="designer-info">
                      <h3>{designer.name}</h3>
                      {designer.specialization && (
                        <p className="specialization">{designer.specialization}</p>
                      )}
                      {designer.experience && (
                        <p className="experience">📅 {designer.experience} years experience</p>
                      )}
                      {designer.address && designer.address.city && (
                        <p className="location">📍 {designer.address.city}</p>
                      )}
                      <Link 
                        to={`/designer/${designer._id}`}
                        className="btn btn-primary"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No designers available at the moment.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
