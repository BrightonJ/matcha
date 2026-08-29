import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';
import { calculateAge } from '../utils/age';
import '../assets/css/publicProfile.css';

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesMe, setLikesMe] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (parseInt(id) === currentUser?.id) {
      navigate('/profile');
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const profileRes = await fetch(`${API_URL}/profile/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!profileRes.ok) throw new Error('Profil indisponible ou bloqué');
        const profileData = await profileRes.json();
        setProfile(profileData);

        const photosRes = await fetch(`${API_URL}/photos/user/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (photosRes.ok) {
          const photosData = await photosRes.json();
          setPhotos(photosData);
        }

        const likeRes = await fetch(`${API_URL}/likes/check/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (likeRes.ok) {
          const likeData = await likeRes.json();
          setIsLiked(likeData.liked);
          setLikesMe(likeData.likesMe);
        }

        const blockRes = await fetch(`${API_URL}/blocks/check/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (blockRes.ok) {
          const blockData = await blockRes.json();
          setIsBlocked(blockData.blocked);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchProfileData();
    }
  }, [id, token, currentUser, navigate]);

  const handleLike = async () => {
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/likes/${id}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsLiked(!isLiked);
        const data = await response.json();
        if (data.match) {
          alert(`❤️ C'est un match avec ${profile.username} !`);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (err) {
      alert("Une erreur est survenue.");
    }
  };

  const handleBlock = async () => {
    if (!window.confirm("Voulez-vous vraiment bloquer cet utilisateur ? Il disparaîtra de vos résultats.")) return;
    
    try {
      const response = await fetch(`${API_URL}/blocks/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert("Utilisateur bloqué.");
        navigate('/search');
      }
    } catch (err) {
      alert("Erreur lors du blocage.");
    }
  };

  const handleReport = async () => {
    if (!window.confirm("Signaler ce profil comme faux compte ?")) return;
    
    try {
      const response = await fetch(`${API_URL}/reports/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        alert("Profil signalé à l'administration.");
      }
    } catch (err) {
      alert("Erreur lors du signalement.");
    }
  };

  const getPhotoUrl = (photoUrl, isExternal) => {
    if (!photoUrl) return '/default-avatar.png';
    if (isExternal) return photoUrl;
    return `${API_URL.replace('/api', '')}${photoUrl}`;
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return "Inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <div className="loading-spinner">Chargement du profil...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!profile) return <div className="error-message">Profil introuvable.</div>;

  const age = calculateAge(profile.birth_date);
  const isMatch = isLiked && likesMe;

  return (
    <div className="public-profile-container">
      <div className="profile-header-main">
        <div className="profile-name-area">
          <h2>
            {profile.first_name} {profile.last_name} ({age} ans)
            <span className="fame-badge">🔥 {profile.popularity_score} Fame</span>
          </h2>
          <p>@{profile.username}</p>
          <div className="status-text">
            {profile.is_online ? (
              <span className="status-online">🟢 En ligne</span>
            ) : (
              <span className="status-offline">⚪ Hors ligne (Vu le {formatLastSeen(profile.last_seen)})</span>
            )}
          </div>
        </div>
      </div>

      <div className="interaction-bar">
        <div className="like-status-info">
          {isMatch ? (
            <span className="like-status-badge">💖 C'est un Match !</span>
          ) : likesMe ? (
            <span className="like-status-badge" style={{ backgroundColor: '#ffe4e6', color: '#e91e63', borderColor: '#e91e63' }}>
              Cette personne vous a liké !
            </span>
          ) : null}
        </div>

        <div className="action-buttons">
          {!isBlocked && (
            <button className={`action-btn ${isLiked ? 'btn-unlike' : 'btn-like'}`} onClick={handleLike}>
              {isLiked ? '💔 Retirer le like' : '🤍 Liker'}
            </button>
          )}
          {isMatch && (
            <button 
              className="action-btn btn-chat" 
              onClick={() => navigate('/chat', { state: { matchId: parseInt(id) } })} 
              style={{ marginLeft: '10px' }}
            >
              💬 Discuter
            </button>
          )}
        </div>
      </div>

      <div className="public-photos">
        {photos.length > 0 ? (
          <img src={getPhotoUrl(photos.find(p => p.is_profile)?.url || photos[0].url, photos.find(p => p.is_profile)?.is_external || photos[0].is_external)} alt="Profile" />
        ) : (
          <div className="no-photo">Aucune photo</div>
        )}
      </div>

      <div className="info-block">
        <h3>📍 Localisation</h3>
        <p>{profile.location_city || 'Lieu inconnu'}</p>
      </div>

      <div className="info-block">
        <h3>📖 Biographie</h3>
        <p>{profile.bio || 'Cet utilisateur n\'a pas encore de bio.'}</p>
      </div>

      <div className="info-block">
        <h3>🏷️ Intérêts</h3>
        <div className="tags-container">
          {profile.tags && profile.tags.length > 0 ? (
            profile.tags.map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))
          ) : (
            <p>Aucun intérêt renseigné.</p>
          )}
        </div>
      </div>

      <div className="danger-actions" style={{ marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
        <button className="action-btn btn-danger" onClick={handleBlock}>🚫 Bloquer</button>
        <button className="action-btn btn-danger" onClick={handleReport}>⚠️ Signaler un faux profil</button>
      </div>
    </div>
  );
}

export default PublicProfile;