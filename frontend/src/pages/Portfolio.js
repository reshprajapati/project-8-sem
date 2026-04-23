import React, { useState, useEffect } from 'react';
import { getDesigns } from '../services/api';
import './Portfolio.css';

const Portfolio = () => {
  const [designs, setDesigns] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesigns();
  }, [filter]);

  const fetchDesigns = async () => {
    try {
      const params = filter !== 'all' ? { category: filter } : {};
      const response = await getDesigns(params);
      setDesigns(response.data.designs || []);
    } catch (err) {
      console.error('Error fetching designs:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'modern', 'traditional', 'contemporary', 'minimalist', 'industrial', 'rustic', 'eclectic'];

  if (loading) {
    return <div className="loading">Loading portfolio...</div>;
  }

  return (
    <div className="portfolio-page">
      <div className="page-header">
        <h1>Design Portfolio</h1>
        <p>Explore our collection of stunning interior designs</p>
      </div>

      <div className="filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {designs.length > 0 ? (
        <div className="portfolio-grid">
          {designs.map(design => (
            <div key={design._id} className="portfolio-item">
              <div className="item-header">
                <h3>{design.title}</h3>
                <span className="category">{design.category}</span>
              </div>
              <p className="designer">by {design.designerId?.name}</p>
              <p className="surface">{design.surfaceType}</p>
              <p className="description">{design.description.substring(0, 100)}...</p>
              {design.clientReview && design.clientReview.rating && (
                <div className="rating">⭐ {design.clientReview.rating}/5</div>
              )}
              <p className="cost">₹{design.cost}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No designs found in this category</p>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
