import { createContext, useState, useContext } from 'react';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'MatchaQueen liked your profile!', read: false },
    { id: 2, text: 'LatteArtKing viewed your profile.', read: true }
  ]);
  const [toastMessage, setToastMessage] = useState(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const triggerToast = (message) => {
    setToastMessage(message);
    const newNotif = { id: Date.now(), text: message, read: false };
    setNotifications(prev => [newNotif, ...prev]);
    
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllAsRead, triggerToast, toastMessage }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);