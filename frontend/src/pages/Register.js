import React, { Component } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import './Auth.css';

class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'user'
      },
      error: '',
      loading: false
    };
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState(prev => ({ formData: { ...prev.formData, [name]: value } }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ error: '', loading: true });

    const { formData } = this.state;
    if (formData.password !== formData.confirmPassword) {
      this.setState({ error: 'Passwords do not match', loading: false });
      return;
    }

    try {
      const response = await register(formData);
      this.props.onRegister(response.data.user, response.data.token);
      this.props.navigate('/');
    } catch (err) {
      console.error('Registration request failed:', err);
      const message = err.response?.data?.message
        || (err.request ? 'Cannot connect to the backend. Start the server on port 5000 and refresh this page.' : null)
        || 'Registration failed. Please try again.';
      this.setState({ error: message });
    } finally {
      this.setState({ loading: false });
    }
  };

  render() {
    const { formData, error, loading } = this.state;

    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Register</h1>
          {error && <div className="error-alert">{error}</div>}
          
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={this.handleChange}>
                <option value="user">User (Client)</option>
                <option value="designer">Designer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={this.handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={this.handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={this.handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={this.handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={this.handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    );
  }
}

export default function RegisterWithNavigate(props) {
  const navigate = useNavigate();
  return <Register {...props} navigate={navigate} />;
}
