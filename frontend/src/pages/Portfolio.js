import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { getDesigns } from '../services/api';
import './Portfolio.css';

class Portfolio extends Component {
  constructor(props) {
    super(props);
    this.state = { designs: [], filter: 'all', loading: true };
  }

  componentDidMount() {
    this.loadDesigns();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.filter !== this.state.filter) {
      this.loadDesigns();
    }
  }

  loadDesigns = async () => {
    try {
      const params = this.state.filter !== 'all' ? { category: this.state.filter } : {};
      const response = await getDesigns(params);
      this.setState({ designs: response.data.designs || [] });
    } catch (err) {
      console.error('Error fetching designs:', err);
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { designs, filter, loading } = this.state;
    const categories = ['all', 'modern', 'traditional', 'contemporary', 'minimalist', 'industrial', 'rustic', 'eclectic'];

    if (loading) return <div className="loading">Loading portfolio...</div>;

    return (
      <div className="portfolio-page">
        <div className="page-header">
          <h1>Design Portfolio</h1>
          <p>Explore the design work that active designers are publishing right now.</p>
        </div>

        <div className="filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => this.setState({ filter: cat })}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {designs.length > 0 ? (
          <div className="portfolio-grid">
            {designs.map(design => (
              <article key={design._id} className="portfolio-item">
                {design.imageUrl ? (
                  <img src={design.imageUrl} alt={design.title} className="portfolio-cover" />
                ) : (
                  <div className="portfolio-cover placeholder">Portfolio preview</div>
                )}

                <div className="item-header">
                  <h3>{design.title}</h3>
                  <span className="category">{design.category}</span>
                </div>
                <p className="designer">by {design.designerId?.name}</p>
                <p className="surface">{design.surfaceType}</p>
                <p className="description">{design.description.substring(0, 100)}...</p>
                {design.materials?.length ? (
                  <p className="materials">{design.materials.join(', ')}</p>
                ) : null}
                {design.clientReview?.rating ? (
                  <div className="rating">Rating: {design.clientReview.rating}/5</div>
                ) : null}
                <p className="cost">Rs. {design.cost || 0}</p>
                {design.designerId?._id ? (
                  <div className="portfolio-actions">
                    <Link to={`/designer/${design.designerId._id}`} className="btn btn-primary">
                      View Designer
                    </Link>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No designs found in this category.</p>
          </div>
        )}
      </div>
    );
  }
}

export default Portfolio;
