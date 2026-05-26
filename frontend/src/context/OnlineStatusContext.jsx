import { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import API_URL from '../config/api';

const OnlineStatusContext = createContext(null);

export const useOnlineStatus = () => useContext(OnlineStatusContext);

export const OnlineStatusProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL.replace('/api', ''), {
      auth: { token }
    });

    socket.on('user_status', (data) => {
      setOnlineUsers(prev => ({ ...prev, [data.userId]: data.isOnline }));
    });

    return () => socket.close();
  }, [token]);

  const isOnline = (userId) => onlineUsers[userId] || false;

  return (
    <OnlineStatusContext.Provider value={{ isOnline, onlineUsers }}>
      {children}
    </OnlineStatusContext.Provider>
  );
};
