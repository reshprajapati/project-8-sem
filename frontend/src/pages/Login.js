import React, { Component } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import './Auth.css';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: { email: '', password: '' },
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

    try {
      const response = await login(this.state.formData);
      this.props.onLogin(response.data.user, response.data.token);
      this.props.navigate('/');
    } catch (err) {
      console.error('Login request failed:', err);
      const message = err.response?.data?.message
        || (err.request ? 'Cannot connect to the backend. Start the server on port 5000 and refresh this page.' : null)
        || 'Login failed. Please try again.';
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
          <h1>Login</h1>
          {error && <div className="error-alert">{error}</div>}
          
          <form onSubmit={this.handleSubmit}>
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
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={this.handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="auth-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    );
  }
}

export default function LoginWithNavigate(props) {
  const navigate = useNavigate();
  return <Login {...props} navigate={navigate} />;
}
