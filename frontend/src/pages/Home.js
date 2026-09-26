import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const featuredDesigners = [
  {
    id: 1,
    name: 'Ava Martinez',
    specialization: 'Luxury Residential',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 2,
    name: 'Noah Bennett',
    specialization: 'Modern Interiors',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 3,
    name: 'Sophia Chen',
    specialization: 'Commercial Spaces',
    image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80'
  }
];

class Home extends Component {
  render() {
    return (
      <div className="home">
      <section className="hero">
        <h1>Welcome to Interior Design Studio</h1>
        <p>Connect with professional designers and transform your spaces</p>
        <div className="hero-buttons">
          <Link to="/register" className="btn btn-primary">Get Started</Link>
          <Link to="/login" className="btn btn-secondary">Login</Link>
        </div>
      </section>

      <section className="features">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>📅 Easy Booking</h3>
            <p>Schedule appointments with professional interior designers at your convenience.</p>
          </div>
          <div className="feature-card">
            <h3>🎨 Quality Designs</h3>
            <p>Get beautiful, customized interior designs tailored to your needs and budget.</p>
          </div>
          <div className="feature-card designer-feature-card">
            <h3>👥 Expert Designers</h3>
            <p>Connect with experienced and certified interior design professionals.</p>
            <div className="designer-photos">
              {featuredDesigners.map((designer) => (
                <div key={designer.id} className="designer-photo-item">
                  <img src={designer.image} alt={designer.name} />
                  <div className="designer-photo-meta">
                    <strong>{designer.name}</strong>
                    <span>{designer.specialization}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="feature-card">
            <h3>📸 Portfolio Showcase</h3>
            <p>Browse completed projects and see before-after transformations.</p>
          </div>
          <div className="feature-card">
            <h3>💬 Direct Communication</h3>
            <p>Communicate directly with designers throughout your project.</p>
          </div>
          <div className="feature-card">
            <h3>🏆 High Quality Results</h3>
            <p>Experience professional design execution with attention to detail.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Create an account as a Client or Designer</p>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Browse Designers</h3>
            <p>Explore portfolios and find the perfect designer</p>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Book Appointment</h3>
            <p>Schedule a consultation and site visit</p>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Get Your Design</h3>
            <p>Receive custom designs for your space</p>
          </div>
        </div>
      </section>
    </div>
    );
  }
}

export default Home;
