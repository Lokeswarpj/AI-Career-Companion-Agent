import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('careerpulse_token');
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          localStorage.removeItem('careerpulse_token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('careerpulse_token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (email, password, fullName) => {
    const data = await api.register({ email, password, full_name: fullName });
    localStorage.setItem('careerpulse_token', data.token);
    setUser(data.user);
    return data;
  };

  const demoLogin = async () => {
    const data = await api.demoLogin();
    localStorage.setItem('careerpulse_token', data.token);
    setUser(data.user);
    return data;
  };

  const sendRegistrationOtp = async (email, password, fullName) => {
    return await api.sendRegistrationOtp({ email, password, full_name: fullName });
  };

  const verifyOtpRegister = async (email, otp) => {
    const data = await api.verifyOtpRegister({ email, otp });
    localStorage.setItem('careerpulse_token', data.token);
    setUser(data.user);
    return data;
  };

  const resendOtp = async (email) => {
    return await api.resendOtp({ email });
  };

  const logout = () => {
    localStorage.removeItem('careerpulse_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      sendRegistrationOtp, 
      verifyOtpRegister, 
      resendOtp, 
      demoLogin, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
