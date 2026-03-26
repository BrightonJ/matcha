import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import '../assets/css/layout.css';
import '../assets/css/notifications.css';

function MainLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, triggerToast, toastMessage } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <header className="navbar">
        <div className="nav-brand">
          <Link to="/search">Matcha Cafe</Link>
        </div>
        <nav className="nav-links">
          <Link to="/search">Search</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/chat">Chat</Link>
          
          <div className="nav-chat" style={{ cursor: 'pointer' }} onClick={() => setShowDropdown(!showDropdown)}>
            🔔
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            
            {showDropdown && (
              <div className="notifications-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="notif-header">
                  <h3>Notifications</h3>
                  <button className="mark-read-btn" onClick={markAllAsRead}>Mark all read</button>
                </div>
                <div className="notif-list">
                  {notifications.map(n => (
                    <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                      {n.text}
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="notif-item" style={{ textAlign: 'center', color: '#888' }}>
                      No new notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="logout-btn">Logout</button>
          <button 
            onClick={() => triggerToast("New fake message received!")} 
            style={{ fontSize: '0.6rem', padding: '2px', position: 'absolute', top: 0, right: 0, opacity: 0.1 }}
          >
            Test
          </button>
        </nav>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
      
      <footer className="footer">
        <p>© 2026 Matcha Cafe. Brewed with love.</p>
      </footer>

      {toastMessage && (
        <div className="toast-container">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default MainLayout;