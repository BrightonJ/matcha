import { Link } from 'react-router-dom';
import '../assets/css/components.css';

function UserCard({ user }) {
  return (
    <Link to={`/user/${user.id}`} className="user-card" style={{ display: 'block', textDecoration: 'none' }}>
      <div className="user-card-image">
        <img src={user.profilePic} alt={`${user.username} profile`} />
        {user.isOnline && <span className="status-indicator online"></span>}
      </div>
      <div className="user-card-info">
        <h3>{user.username}, {user.age}</h3>
        <p className="location">📍 {user.location}</p>
        <div className="tags-container">
          {user.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
        <div className="card-footer">
          <span className="fame-rating">🔥 {user.fameRating} Fame</span>
          <button 
            className="like-btn" 
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            ❤️ Like
          </button>
        </div>
      </div>
    </Link>
  );
}

export default UserCard;