import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationBell from '../components/NotificationBell';
import Avatar from '../components/Avatar';
import '../assets/css/layout.css';
import '../assets/css/notification.css';

function MainLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toastMessage } = useNotifications();

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
          <NotificationBell />
          {user && <Avatar user={user} size="sm" onClick={() => navigate('/profile')} />}
          <button onClick={handleLogout} className="logout-btn">Logout</button>
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
