import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/users/me');
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data.user;
  };

  const adminLogin = async (loginEmailOrPassword, maybePassword) => {
    let emailToSend = 'kodifyofficial@gmail.com';
    let passwordToSend = loginEmailOrPassword;
    if (maybePassword !== undefined) {
      emailToSend = loginEmailOrPassword || 'kodifyofficial@gmail.com';
      passwordToSend = maybePassword;
    }
    const res = await axios.post('/api/auth/admin-login', { email: emailToSend, password: passwordToSend });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await axios.post('/api/auth/register', data);
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data.user;
  };

  const loginWithGoogle = async (credential) => {
    const res = await axios.post('/api/auth/google', { credential, idToken: credential });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await axios.put('/api/users/me', data);
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, login, adminLogin, register, loginWithGoogle, logout, updateProfile, loading }}>
      {!loading ? children : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: 'var(--primary, #0081A7)', backgroundColor: 'var(--bg, #f8fafc)' }}>
          <div style={{ textCenter: 'center' }}>
            <h1 style={{ color: '#0081A7', margin: 0 }}>KODIFY</h1>
            <p style={{ color: '#00AFB9', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Loading application...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
