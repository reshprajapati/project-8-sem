import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUserProfile, getDesigns } from '../services/api';
import './DesignerProfile.css';

const DesignerProfile = () => {
  const { id } = useParams();
  const [designer, setDesigner] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesignerData();
  }, [id]);

  const fetchDesignerData = async () => {
    try {
      const designerRes = await getUserProfile(id);
      setDesigner(designerRes.data.user);

      const designsRes = await getDesigns({ designerId: id });
      setDesigns(designsRes.data.designs || []);
    } catch (err) {
      console.error('Error fetching designer data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading designer profile...</div>;
  }

  if (!designer) {
    return <div className="error">Designer not found</div>;
  }

  return (
    <div className="designer-profile">
      <div className="profile-header">
        {designer.profileImage ? (
          <img src={designer.profileImage} alt={designer.name} className="profile-image" />
        ) : (
          <div className="profile-image-placeholder">👤</div>
        )}
        <div className="profile-info">
          <h1>{designer.name}</h1>
          {designer.specialization && <p className="specialization">{designer.specialization}</p>}
          {designer.experience && <p className="experience">📅 {designer.experience} years of experience</p>}
          {designer.address && designer.address.city && (
            <p className="location">📍 {designer.address.city}, {designer.address.state}</p>
          )}
          {designer.bio && <p className="bio">{designer.bio}</p>}
        </div>
      </div>

      {designer.socialLinks && (
        <div className="social-links">
          {designer.socialLinks.website && (
            <a href={designer.socialLinks.website} target="_blank" rel="noopener noreferrer">🌐 Website</a>
          )}
          {designer.socialLinks.instagram && (
            <a href={designer.socialLinks.instagram} target="_blank" rel="noopener noreferrer">📷 Instagram</a>
          )}
          {designer.socialLinks.facebook && (
            <a href={designer.socialLinks.facebook} target="_blank" rel="noopener noreferrer">f Facebook</a>
          )}
        </div>
      )}

      <div className="portfolio-section">
        <h2>Portfolio</h2>
        {designs.length > 0 ? (
          <div className="designs-grid">
            {designs.map(design => (
              <div key={design._id} className="design-item">
                <h3>{design.title}</h3>
                <p className="surface">{design.surfaceType}</p>
                <p className="category">{design.category}</p>
                <p className="design-description">{design.description.substring(0, 80)}...</p>
                {design.clientReview && design.clientReview.rating && (
                  <div className="rating">⭐ {design.clientReview.rating}/5</div>
                )}
                <p className="cost">₹{design.cost}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No portfolio items yet</p>
        )}
      </div>
    </div>
  );
};

export default DesignerProfile;
