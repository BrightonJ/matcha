import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { calculateAge } from '../utils/age';
import mockUsers from '../mocks/users.json';
import '../assets/css/publicProfile.css';

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLikedByMe, setIsLikedByMe] = useState(false);
  const [isLikedByThem, setIsLikedByThem] = useState(false);
  const [commonTags, setCommonTags] = useState([]);

  useEffect(() => {
    setTimeout(() => {
      const foundUser = mockUsers.find(u => u.id === parseInt(id));
      
      if (!foundUser) {
        navigate('/search');
        return;
      }

      setUser(foundUser);

      console.log(`[Mock API] Visite enregistrée pour le profil ID: ${foundUser.id}`);

      const myTags = JSON.parse(localStorage.getItem('mockProfileTags') || '[]');
      if (foundUser.tags && myTags.length > 0) {
        const common = foundUser.tags.filter(tag => myTags.includes(tag));
        setCommonTags(common);
      }

      if (foundUser.id % 2 === 0) setIsLikedByThem(true);

      setLoading(false);
    }, 400);
  }, [id, navigate]);

  const handleLikeToggle = () => {
    if (isLikedByMe) {
      setIsLikedByMe(false);
      alert(`💔 Vous avez retiré votre like pour ${user.first_name}.`);
    } else {
      setIsLikedByMe(true);
      if (isLikedByThem) {
        alert(`🎉 C'est un match ! Vous pouvez maintenant discuter avec ${user.first_name}`);
      } else {
        alert(`❤️ Vous avez liké ${user.first_name} !`);
      }
    }
  };

  const handleBlock = () => {
    alert('🚫 Utilisateur bloqué. Il n\'apparaîtra plus dans vos recherches.');
    navigate('/search');
  };

  const handleReport = () => {
    alert('🚩 Faux compte signalé aux modérateurs.');
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return "Inconnue";
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="public-profile-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          Recherche du profil en cours...
        </div>
      </div>
    );
  }

  if (!user) return null;

  const age = calculateAge(user.birth_date) || 25;
  const profilePhoto = `https://ui-avatars.com/api/?background=8baa5e&color=fff&size=300&name=${user.username}`;

  return (
    <div className="public-profile-container">
      <div className="profile-header-main">
        <div className="profile-name-area">
          <h2>
            {user.first_name} {user.last_name} ({age})
            <span className="fame-badge">🔥 {user.popularity_score || 0} Fame</span>
          </h2>
          <p>@{user.username}</p>
          {user.is_online ? (
            <p className="status-text status-online">🟢 En ligne</p>
          ) : (
            <p className="status-text status-offline">⚪ Dernière visite : {formatLastSeen(user.last_connection)}</p>
          )}
        </div>
      </div>

      <div className="interaction-bar">
        {isLikedByThem && <div className="like-status-badge">✨ Cette personne vous a liké !</div>}
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className={`action-btn ${isLikedByMe ? 'btn-unlike' : 'btn-like'}`} onClick={handleLikeToggle}>
            {isLikedByMe ? '💔 Unlike' : '❤️ Like'}
          </button>
          
          {isLikedByMe && isLikedByThem && (
            <button className="action-btn btn-chat" onClick={() => navigate('/chat')}>
              💬 Envoyer un message
            </button>
          )}
        </div>

        <div className="danger-actions">
          <button className="action-btn btn-danger" onClick={handleReport}>🚩 Signaler</button>
          <button className="action-btn btn-danger" onClick={handleBlock}>🚫 Bloquer</button>
        </div>
      </div>

      <div className="public-photos" style={{ textAlign: 'center' }}>
         <img src={profilePhoto} alt="Photo de profil" style={{ width: '100%', maxWidth: '300px', borderRadius: '50%', border: '4px solid var(--color-sunlight)' }} />
      </div>

      <div className="info-block">
        <h3>📍 Localisation</h3>
        <p>{user.location_city || 'Localisation inconnue'}</p>
      </div>

      <div className="info-block">
        <h3>📖 Biographie</h3>
        <p>{user.bio || "Aucune biographie pour le moment. Cette personne préfère garder le mystère..."}</p>
      </div>

      <div className="info-block">
        <h3>🏷️ Centres d'intérêt</h3>
        <div className="tags-container">
          {user.tags && user.tags.length > 0 ? (
            user.tags.map((tag, idx) => (
              <span key={idx} className={`tag ${commonTags.includes(tag) ? 'common-tag' : ''}`}>
                {tag} {commonTags.includes(tag) && ' ✓'}
              </span>
            ))
          ) : (
            <p>Aucun centre d'intérêt renseigné</p>
          )}
        </div>
        {commonTags.length > 0 && (
          <p className="common-tags-message">🎯 Vous avez {commonTags.length} centre(s) d'intérêt en commun !</p>
        )}
      </div>
    </div>
  );
}

export default PublicProfile;