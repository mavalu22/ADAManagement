import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    // Valida o token no backend e obtém dados frescos do usuário
    api.get('/me')
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        // Token inválido ou expirado — limpa sessão
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/login', { email, password });
    
    // O Backend agora retorna { token: "...", user: { name: "...", role: "..." } }
    const { token, user: userData } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ authenticated: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};