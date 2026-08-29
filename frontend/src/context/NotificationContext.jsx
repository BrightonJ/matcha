import { createContext, useState, useContext, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useLocation } from 'react-router-dom';
import API_URL from '../config/api';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const token = localStorage.getItem('token');
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setToastMessage(notification.content);
      setTimeout(() => setToastMessage(null), 4000);
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  const fetchNotifications = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Erreur récupération notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
      }
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error('Erreur marquage tout lu:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (err) {
      console.error('Erreur suppression notification:', err);
    }
  };

  const triggerToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount,
      loading,
      markAsRead, 
      markAllAsRead,
      deleteNotification,
      triggerToast, 
      toastMessage,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
