import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
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
          <div className="feature-card">
            <h3>👥 Expert Designers</h3>
            <p>Connect with experienced and certified interior design professionals.</p>
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
};

export default Home;
