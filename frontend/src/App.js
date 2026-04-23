import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { getProfile } from './services/api';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import DesignerProfile from './pages/DesignerProfile';
import Portfolio from './pages/Portfolio';
import Appointments from './pages/Appointments';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      checkUser();
    } else {
      setLoading(false);
    }
  }, []);

  const checkUser = async () => {
    try {
      const response = await getProfile();
      setUser(response.data.user);
    } catch (err) {
      console.error('Error fetching user:', err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        {user && <Navigation user={user} onLogout={handleLogout} />}
        <div className="app-content">
          <Routes>
            {!user ? (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/register" element={<Register onRegister={handleLogin} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/appointments" element={<Appointments user={user} />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/designer/:id" element={<DesignerProfile />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
