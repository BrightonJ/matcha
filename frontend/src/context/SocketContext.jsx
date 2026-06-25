import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import API_URL from '../config/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { isAuthenticated } = useAuth();
  const baseUrl = API_URL.replace('/api', '');

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem('token'); // Modifié ici
      const newSocket = io(baseUrl, {
        auth: { token },
        reconnection: true
      });

      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      if (socket) socket.close();
      setSocket(null);
    }
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};