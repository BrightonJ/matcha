import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import '../assets/css/notification.css';

function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // Rediriger en fonction du type de notification
  const handleNotificationClick = (notification) => {
    // Marquer comme lue
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Fermer le dropdown
    setIsOpen(false);
    
    // Rediriger selon le type
    switch (notification.type) {
      case 'like':
      case 'match':
        // Rediriger vers le profil de la personne
        if (notification.from_user_id) {
          navigate(`/profile/${notification.from_user_id}`);
        } else {
          navigate('/search');
        }
        break;
      case 'message':
        // Rediriger vers le chat
        if (notification.from_user_id) {
          navigate('/chat');
        } else {
          navigate('/chat');
        }
        break;
      case 'visit':
        // Rediriger vers le profil du visiteur
        if (notification.from_user_id) {
          navigate(`/profile/${notification.from_user_id}`);
        } else {
          navigate('/search');
        }
        break;
      default:
        navigate('/search');
    }
  };

  const handleDeleteClick = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  return (
    <div className="notification-container">
      <button 
        className={`notification-bell ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">Aucune notification</p>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-content">
                    <p>{notif.content}</p>
                    <small>{new Date(notif.created_at).toLocaleString()}</small>
                  </div>
                  <button 
                    className="delete-notif"
                    onClick={(e) => handleDeleteClick(e, notif.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
