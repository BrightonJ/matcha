import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { calculateAge } from '../utils/age';
import '../assets/css/publicProfile.css';

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLikedByMe, setIsLikedByMe] = useState(false);
  const [isLikedByThem, setIsLikedByThem] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [commonTags, setCommonTags] = useState([]);
  const [myTags, setMyTags] = useState([]);

  const token = localStorage.getItem('token');

  // Récupérer mes tags
  const fetchMyTags = async () => {
    try {
      const response = await fetch(`${API_URL}/tags/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyTags(data.map(t => `#${t.name}`));
      }
    } catch (err) {
      console.error('Erreur récupération mes tags:', err);
    }
  };

  // Récupérer le profil public
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 404) {
        navigate('/search');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        
        // Calculer les tags communs si mes tags sont chargés
        if (data.tags && myTags.length > 0) {
          const common = data.tags.filter(tag => myTags.includes(tag));
          setCommonTags(common);
        }
      } else {
        navigate('/search');
      }
    } catch (err) {
      console.error('Erreur récupération profil:', err);
      navigate('/search');
    }
  };

  // Récupérer les photos
  const fetchUserPhotos = async () => {
    try {
      const response = await fetch(`${API_URL}/photos/user/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (err) {
      console.error('Erreur récupération photos:', err);
    }
  };

  // Vérifier si j'ai liké ce profil
  const checkLikeStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/likes/check/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLikedByMe(data.liked);
      }
    } catch (err) {
      console.error('Erreur vérification like:', err);
    }
  };

  // Vérifier si ce profil m'a liké
  const checkIfLikedByThem = async () => {
    try {
      const response = await fetch(`${API_URL}/likes/received`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const likedByThem = data.some(like => like.from_user_id === parseInt(id));
        setIsLikedByThem(likedByThem);
      }
    } catch (err) {
      console.error('Erreur vérification like reçu:', err);
    }
  };

  // Vérifier si bloqué
  const checkBlockStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/blocks/check/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.blocked) {
          setIsBlocked(true);
          navigate('/search');
        }
      }
    } catch (err) {
      console.error('Erreur vérification blocage:', err);
    }
  };

  // Charger mes tags d'abord
  useEffect(() => {
    fetchMyTags();
  }, []);

  // Une fois mes tags chargés, charger le profil
  useEffect(() => {
    if (id && token) {
      fetchUserProfile();
      checkLikeStatus();
      checkIfLikedByThem();
      checkBlockStatus();
    }
  }, [id, token]);

  // Une fois le profil chargé, charger les photos
  useEffect(() => {
    if (user) {
      fetchUserPhotos();
      setLoading(false);
    }
  }, [user]);

  // Mettre à jour les tags communs quand les tags de l'utilisateur ou mes tags changent
  useEffect(() => {
    if (user?.tags && myTags.length > 0) {
      const common = user.tags.filter(tag => myTags.includes(tag));
      setCommonTags(common);
    }
  }, [user?.tags, myTags]);

  const handleLikeToggle = async () => {
    try {
      if (isLikedByMe) {
        const response = await fetch(`${API_URL}/likes/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          setIsLikedByMe(false);
        }
      } else {
        const response = await fetch(`${API_URL}/likes/${id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLikedByMe(true);
          if (data.match) {
            alert(`❤️ C'est un match ! Vous pouvez maintenant discuter avec ${user.first_name}`);
          }
        }
      }
    } catch (err) {
      console.error('Erreur like/unlike:', err);
    }
  };

  const handleBlock = async () => {
    try {
      const response = await fetch(`${API_URL}/blocks/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setIsBlocked(true);
        alert('Utilisateur bloqué. Il n\'apparaîtra plus dans vos recherches.');
        navigate('/search');
      }
    } catch (err) {
      console.error('Erreur blocage:', err);
    }
  };

  const handleReport = () => {
    alert('Utilisateur signalé aux modérateurs.');
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Récemment';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return `Il y a ${Math.floor(diff / 1440)}j`;
  };

  if (loading) {
    return (
      <div className="public-profile-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          Chargement du profil...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="public-profile-container">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          Profil non trouvé
        </div>
      </div>
    );
  }

  const age = calculateAge(user.birth_date);
  const profilePhoto = photos.find(p => p.is_profile);
  const otherPhotos = photos.filter(p => !p.is_profile);
  const hasProfilePhoto = profilePhoto ? `${API_URL.replace('/api', '')}${profilePhoto.url}` : null;

  return (
    <div className="public-profile-container">
      <div className="profile-header-main">
        <div className="profile-name-area">
          <h2>
            {user.first_name} {user.last_name} ({age || '?'})
            <span className="fame-badge">🔥 {user.popularity_score || 0} Fame</span>
          </h2>
          <p>@{user.username}</p>
          {user.is_online ? (
            <p className="status-text status-online">🟢 En ligne</p>
          ) : (
            <p className="status-text status-offline">⚪ Dernière visite: {formatLastSeen(user.last_seen)}</p>
          )}
        </div>
      </div>

      <div className="interaction-bar">
        {isLikedByThem && <div className="like-status-badge">✨ Cette personne vous a liké !</div>}
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className={`action-btn ${isLikedByMe ? 'btn-unlike' : 'btn-like'}`} 
            onClick={handleLikeToggle}
          >
            {isLikedByMe ? '💔 Unlike' : '❤️ Like'}
          </button>
          
          {isLikedByMe && isLikedByThem && (
            <button 
              className="action-btn btn-chat"
              onClick={() => navigate('/chat')}
            >
              💬 Envoyer un message
            </button>
          )}
        </div>

        <div className="danger-actions">
          <button className="action-btn btn-danger" onClick={handleReport}>🚩 Signaler</button>
          <button className="action-btn btn-danger" onClick={handleBlock}>🚫 Bloquer</button>
        </div>
      </div>

      <div className="public-photos">
        {hasProfilePhoto ? (
          <img src={hasProfilePhoto} alt="Photo de profil" />
        ) : (
          <div className="no-photo">Aucune photo de profil</div>
        )}
      </div>

      {otherPhotos.length > 0 && (
        <div className="other-photos">
          <h3>📸 Autres photos</h3>
          <div className="photos-grid">
            {otherPhotos.map(photo => (
              <img 
                key={photo.id} 
                src={`${API_URL.replace('/api', '')}${photo.url}`} 
                alt="Photo"
              />
            ))}
          </div>
        </div>
      )}

      <div className="info-block">
        <h3>📍 Localisation</h3>
        {user.location_city ? (
          <p>{user.location_city}</p>
        ) : user.latitude && user.longitude ? (
          <p>Coordonnées GPS: {user.latitude.toFixed(4)}, {user.longitude.toFixed(4)}</p>
        ) : (
          <p>Non renseignée</p>
        )}
      </div>

      <div className="info-block">
        <h3>📖 Biographie</h3>
        <p>{user.bio || 'Aucune biographie pour le moment.'}</p>
      </div>

      <div className="info-block">
        <h3>🏷️ Centres d'intérêt</h3>
        <div className="tags-container">
          {user.tags && user.tags.length > 0 ? (
            user.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className={`tag ${commonTags.includes(tag) ? 'common-tag' : ''}`}
              >
                {tag}
                {commonTags.includes(tag) && ' ✓'}
              </span>
            ))
          ) : (
            <p>Aucun centre d'intérêt renseigné</p>
          )}
        </div>
        {commonTags.length > 0 && (
          <p className="common-tags-message">
            🎯 Vous avez {commonTags.length} centre(s) d'intérêt en commun !
          </p>
        )}
      </div>
    </div>
  );
}

export default PublicProfile;
