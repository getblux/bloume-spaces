// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email, password, name, spaceName) => {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, spaceName })
      });
      
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Set the user in context
      setCurrentUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const login = async (email, password) => {
    // You'll need to create a /login endpoint in your backend
    // For now, we'll keep Firebase login or create simple auth
    throw new Error('Login not implemented yet - use Firebase for now');
  };

  const logout = () => {
    setCurrentUser(null);
    return Promise.resolve();
  };

  useEffect(() => {
    // Check if user is logged in (you'll need to implement sessions)
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};