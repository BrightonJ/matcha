import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { calculateAge } from '../utils/age';
import '../assets/css/publicProfile.css';
import { useNotifications } from '../context/NotificationContext';

function PublicProfileProd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { triggerToast } = useNotifications();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLikedByMe, setIsLikedByMe] = useState(false);
  const token = localStorage.getItem('token');

  const getPhotoUrl = (photoUrl, isExternal) => {
    if (!photoUrl) return `https://ui-avatars.com/api/?background=8baa5e&color=fff&size=300&name=${user?.username || 'User'}`;
    if (isExternal) return photoUrl;
    return `${API_URL.replace('/api', '')}${photoUrl}`;
  };

  useEffect(() => {
    fetch(`${API_URL}/profile/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error("Profil introuvable");
        return res.json();
      })
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => navigate('/search'));

    fetch(`${API_URL}/likes/check/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setIsLikedByMe(data.liked))
      .catch(err => console.error(err));
  }, [id, token, navigate]);

  const handleLikeToggle = async () => {
    try {
      const method = isLikedByMe ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/likes/${id}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setIsLikedByMe(!isLikedByMe);
        const data = await response.json();
        if (data.match) alert(`🎉 C'est un match avec ${user.first_name} !`);
      }
    } catch (err) {
      alert("Erreur lors du like.");
    }
  };

  const handleBlock = async () => {
    await fetch(`${API_URL}/blocks/${id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    alert('🚫 Utilisateur bloqué.');
    navigate('/search');
  };

  const handleReport = async () => {
    if (window.confirm("Voulez-vous vraiment signaler cet utilisateur comme faux compte ?")) {
      try {
        const response = await fetch(`${API_URL}/reports/${id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
          triggerToast("Utilisateur signalé avec succès.");
        } else {
          triggerToast(data.error || "Erreur lors du signalement.");
        }
      } catch (err) {
        triggerToast("Erreur serveur lors du signalement.");
      }
    }
  };

  if (loading) return <div className="public-profile-container" style={{ textAlign: 'center', padding: '3rem' }}>Recherche du profil en cours...</div>;
  if (!user) return null;

  const age = calculateAge(user.birth_date);

  return (
    <div className="public-profile-container">
      <div className="profile-header-main">
        <div className="profile-name-area">
          <h2>{user.first_name} {user.last_name} ({age}) <span className="fame-badge">🔥 {user.popularity_score || 0} Fame</span></h2>
          <p>@{user.username}</p>
          {user.is_online ? <p className="status-text status-online">🟢 En ligne</p> : <p className="status-text status-offline">⚪ Hors ligne</p>}
        </div>
      </div>

      <div className="interaction-bar">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className={`action-btn ${isLikedByMe ? 'btn-unlike' : 'btn-like'}`} onClick={handleLikeToggle}>
            {isLikedByMe ? '💔 Unlike' : '❤️ Like'}
          </button>
        </div>
        <div className="danger-actions">
          <button className="action-btn btn-danger" onClick={handleReport}>🚩 Signaler</button>
          <button className="action-btn btn-danger" onClick={handleBlock}>🚫 Bloquer</button>
        </div>
      </div>

      <div className="public-photos" style={{ textAlign: 'center' }}>
         <img src={getPhotoUrl(user.profile_photo, user.photo_is_external)} alt="Profil" style={{ width: '100%', maxWidth: '300px', borderRadius: '50%', border: '4px solid var(--color-sunlight)', objectFit: 'cover', aspectRatio: '1/1' }} />
      </div>

      <div className="info-block">
        <h3>📍 Localisation</h3>
        <p>{user.location_city || 'Localisation inconnue'}</p>
      </div>

      <div className="info-block">
        <h3>📖 Biographie</h3>
        <p>{user.bio || "Cette personne préfère garder le mystère..."}</p>
      </div>
    </div>
  );
}

export default PublicProfileProd;