import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🎨 Interior Design Studio
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-link">Dashboard</Link>
          </li>
          <li className="nav-item">
            <Link to="/appointments" className="nav-link">Appointments</Link>
          </li>
          <li className="nav-item">
            <Link to="/portfolio" className="nav-link">Portfolio</Link>
          </li>
          <li className="nav-item">
            <span className="nav-link user-info">
              👤 {user.name} ({user.role})
            </span>
          </li>
          <li className="nav-item">
            <button className="nav-link logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
