import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import API_URL from '../config/api';
import { calculateAge } from '../utils/age';
import '../assets/css/components.css';

function UserCard({ user, currentUserTags = [] }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const getPhotoUrl = (photoUrl, isExternal) => {
    if (!photoUrl) return '/default-avatar.png';
    if (isExternal) return photoUrl;
    return `${API_URL.replace('/api', '')}${photoUrl}`;
  };

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/likes/check/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.liked);
        }
      } catch (err) {
        console.error('Erreur vérification like:', err);
      }
    };
    
    if (user.id) {
      checkLikeStatus();
    }
  }, [user.id]);

  const age = calculateAge(user.birth_date);
  const location = user.location_city || user.location || 'Location inconnue';
  const tags = user.tags || [];
  const profilePhoto = getPhotoUrl(user.profile_photo, user.photo_is_external);

  const handleLike = async (e) => {
    e.preventDefault();
    if (likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const method = isLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(`${API_URL}/likes/${user.id}`, {
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
          alert(`❤️ C'est un match avec ${user.first_name || user.username} ! Vous pouvez maintenant discuter.`);
        }
      }
    } catch (err) {
      console.error('Erreur like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <Link to={`/profile/${user.id}`} className="user-card" style={{ display: 'block', textDecoration: 'none' }}>
      <div className="user-card-image">
        <img src={profilePhoto} alt={`${user.username} profile`} />
        {user.is_online && <span className="status-indicator online"></span>}
      </div>
      <div className="user-card-info">
        <h3>{user.first_name || user.username} {user.last_name || ''}, {age}</h3>
        <p className="location">📍 {location}</p>
        <div className="tags-container">
          {tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
          {tags.length > 3 && <span className="tag">+{tags.length - 3}</span>}
        </div>
        <div className="card-footer">
          <span className="fame-rating">🔥 {user.popularity_score || 0} Fame</span>
          <button 
            className={`like-btn ${isLiked ? 'liked' : ''}`} 
            onClick={handleLike}
            disabled={likeLoading}
          >
            {isLiked ? '❤️ Liked' : '🤍 Like'}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default UserCard;
