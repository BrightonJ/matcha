import { createContext, useState, useContext } from 'react';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    { id: 1, content: 'MatchaQueen a visité votre profil', is_read: false, created_at: new Date(), type: 'visit' }
  ]);
  const [toastMessage, setToastMessage] = useState(null);
  const [loading] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  const deleteNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));
  
  const triggerToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, unreadCount, loading, markAsRead, markAllAsRead, 
      deleteNotification, triggerToast, toastMessage, refreshNotifications: () => {}
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);