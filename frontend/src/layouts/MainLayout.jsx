import { useState, useRef, useEffect } from 'react';
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
  
  // Nouveaux états pour gérer l'UI
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <header className="navbar">
        <div className="nav-brand">
          <Link to="/search">Matcha Cafe</Link>
        </div>
        
        <div className="nav-links">
          <Link to="/search">Search</Link>
          <Link to="/chat">Chat</Link>
          <NotificationBell />
          
          {user && (
            <div className="user-menu-container" ref={dropdownRef}>
              <div 
                className="avatar-trigger" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Avatar user={user} size="sm" />
              </div>

              {/* Menu déroulant */}
              {isDropdownOpen && (
                <div className="avatar-dropdown">
                  <div className="dropdown-header">
                    <strong>{user.username}</strong>
                  </div>
                  <button onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}>
                    ⚙️ Settings
                  </button>
                  <button className="dropdown-logout" onClick={() => { setIsDropdownOpen(false); setIsLogoutModalOpen(true); }}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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

      {/* Pop-up de confirmation de déconnexion */}
      {isLogoutModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Leaving so soon? ☕</h3>
            <p>Are you sure you want to logout?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsLogoutModalOpen(false)}>
                Not yet
              </button>
              <button className="btn-confirm" onClick={handleLogoutConfirm}>
                Yes, logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainLayout;