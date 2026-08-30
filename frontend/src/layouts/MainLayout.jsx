import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationBell from '../components/NotificationBell';
import Avatar from '../components/Avatar';
import '../assets/css/layout.css';
import '../assets/css/notification.css';

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { toastMessage } = useNotifications();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isProfileIncomplete = user && (
    !user.gender || 
    !user.bio || 
    !user.birth_date || 
    !user.location_city || 
    !user.profile_photo || 
    !user.tags || 
    user.tags.length === 0
  );

  if (isProfileIncomplete && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />;
  }

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-container">
      <header className="navbar">
        <div className="nav-brand">
          <Link to="/search">Matcha</Link>
        </div>
        
        <div className="nav-links">
          <Link to="/search">Recherche</Link>
          <Link to="/chat">Messages</Link>
          <NotificationBell />
          
          {user && (
            <div className="user-menu-container" ref={dropdownRef}>
              <div 
                className="avatar-trigger" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Avatar user={user} size="sm" />
              </div>

              {isDropdownOpen && (
                <div className="avatar-dropdown">
                  <div className="dropdown-header">
                    <strong>{user.username}</strong>
                  </div>
                  <button onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}>
                    ⚙️ Paramètres
                  </button>
                  <button className="dropdown-logout" onClick={() => { setIsDropdownOpen(false); setIsLogoutModalOpen(true); }}>
                    🚪 Déconnexion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      
      <main className="main-content">
        {isProfileIncomplete && location.pathname === '/profile' && (
          <div style={{ backgroundColor: '#ff9800', color: 'white', padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
            ⚠️ Vous devez remplir TOUTES vos informations (Bio, Genre, Localisation, au moins 1 Tag et 1 Photo) pour utiliser le site.
          </div>
        )}
        <Outlet />
      </main>
      
      <footer className="footer">
        <p>© 2026 Matcha. Parce que l'amour aussi, ça s'industrialise.</p>
      </footer>

      {toastMessage && (
        <div className="toast-container">
          {toastMessage}
        </div>
      )}

      {isLogoutModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Partir si tôt ? ☕</h3>
            <p>Voulez-vous vraiment vous déconnecter ?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsLogoutModalOpen(false)}>
                Non, annuler
              </button>
              <button className="btn-confirm" onClick={handleLogoutConfirm}>
                Oui, me déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainLayout;