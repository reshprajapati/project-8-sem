import React, { Component } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navigation.css';

class Navigation extends Component {
  handleLogout = () => {
    const { onLogout, navigate } = this.props;
    onLogout();
    navigate('/');
  };

  render() {
    const { user } = this.props;
    const isAdmin = user.role === 'admin';

    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            🎨 Interior Design Studio
          </Link>
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className="nav-link">{isAdmin ? 'Admin Console' : 'Dashboard'}</Link>
            </li>
            {!isAdmin ? (
              <li className="nav-item">
                <Link to="/appointments" className="nav-link">Appointments</Link>
              </li>
            ) : null}
            {user.role === 'user' ? (
              <li className="nav-item">
                <Link to="/projects" className="nav-link">My Projects</Link>
              </li>
            ) : null}
            <li className="nav-item">
              <Link to="/portfolio" className="nav-link">Portfolio</Link>
            </li>
            <li className="nav-item">
              <span className="nav-link user-info">
                <span className="user-name">👤 {user.name}</span>
                <span className="user-role">{user.role}</span>
              </span>
            </li>
            <li className="nav-item">
              <button className="nav-link logout-btn" onClick={this.handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </nav>
    );
  }
}

export default function NavigationWithRouter(props) {
  const navigate = useNavigate();
  return <Navigation {...props} navigate={navigate} />;
}
