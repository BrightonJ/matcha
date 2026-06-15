import { Link } from 'react-router-dom';
import { useState } from 'react';
import { calculateAge } from '../utils/age';
import '../assets/css/components.css';

function UserCard({ user }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const age = calculateAge(user.birth_date) || 25;
  const location = user.location_city || 'Location inconnue';
  const tags = user.tags || [];
  const profilePhoto = `https://ui-avatars.com/api/?background=8baa5e&color=fff&name=${user.username}`;

  const handleLike = (e) => {
    e.preventDefault(); 
    setLikeLoading(true);
    
    setTimeout(() => {
      if (isLiked) {
        alert(`💔 Vous avez retiré votre like pour ${user.first_name}.`);
      } else {
        if (user.id % 2 === 0) {
          alert(`🎉 IT'S A MATCH ! ${user.first_name} vous avait aussi liké ! Vous pouvez discuter.`);
        } else {
          alert(`❤️ Vous avez liké ${user.first_name} !`);
        }
      }
      setIsLiked(!isLiked);
      setLikeLoading(false);
    }, 300);
  };

  return (
    <Link to={`/profile/${user.id}`} className="user-card" style={{ display: 'block', textDecoration: 'none' }}>
      <div className="user-card-image">
        <img src={profilePhoto} alt={`${user.username} profile`} />
        {user.is_online && <span className="status-indicator online"></span>}
      </div>
      <div className="user-card-info">
        <h3>{user.first_name}, {age}</h3>
        <p className="location">📍 {location}</p>
        <div className="tags-container">
          {tags.slice(0, 3).map((tag, index) => <span key={index} className="tag">{tag}</span>)}
        </div>
        <div className="card-footer">
          <span className="fame-rating">🔥 {user.popularity_score || 0} Fame</span>
          <button className={`like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} disabled={likeLoading}>
            {isLiked ? '💔 Unlike' : '🤍 Like'}
          </button>
        </div>
      </div>
    </Link>
  );
}

export default UserCard;