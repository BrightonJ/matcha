import { createContext, useState, useContext, useEffect } from 'react';
import { io } from 'socket.io-client';
import API_URL from '../config/api';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [socket, setSocket] = useState(null);

  const token = localStorage.getItem('token');
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Initialiser Socket.io
  useEffect(() => {
    if (!token) return;

    const newSocket = io(API_URL.replace('/api', ''), {
      auth: { token }
    });

    newSocket.on('notification', (notification) => {
      console.log('🔔 New notification:', notification);
      
      // Ajouter la notification à la liste
      setNotifications(prev => [notification, ...prev]);
      
      // Afficher le toast
      setToastMessage(notification.content);
      setTimeout(() => setToastMessage(null), 4000);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]);

  // Récupérer les notifications existantes depuis le backend
  useEffect(() => {
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
      }
    };

    fetchNotifications();
  }, [token]);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error('Erreur marquage lu:', err);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Erreur marquage tout lu:', err);
    }
  };

  // Trigger une notification (pour les actions locales)
  const triggerToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAllAsRead, 
      markAsRead,
      triggerToast, 
      toastMessage 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
