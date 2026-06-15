import { createContext, useState, useContext, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un faux token existe au chargement
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ id: 99, username: 'MockUser', first_name: 'Test', last_name: 'Local' });
    }
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: "Inscription simulée avec succès !" };
  };

  const login = async (username, password) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    localStorage.setItem('token', 'fake-jwt-token');
    setUser({ id: 99, username: username, first_name: username, last_name: 'Mock' });
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);