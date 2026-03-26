import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import mockUsers from '../mocks/users.json';
import '../assets/css/publicProfile.css';

function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLikedByMe, setIsLikedByMe] = useState(false);
  const [isLikedByThem, setIsLikedByThem] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const foundUser = mockUsers.find(u => u.id === parseInt(id));
    if (!foundUser) {
      navigate('/search');
      return;
    }
    setUser(foundUser);
    setIsLikedByThem(foundUser.id === 2);
  }, [id, navigate]);

  const handleLikeToggle = () => {
    setIsLikedByMe(!isLikedByMe);
  };

  const handleBlock = () => {
    setIsBlocked(true);
    alert('User blocked. They will no longer appear in your searches or be able to contact you.');
    navigate('/search');
  };

  const handleReport = () => {
    alert('User reported as a fake account to moderators.');
  };

  if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  return (
    <div className="public-profile-container">
      <div className="profile-header-main">
        <div className="profile-name-area">
          <h2>
            {user.firstName} {user.lastName} ({user.age})
            <span className="fame-badge">🔥 {user.fameRating} Fame</span>
          </h2>
          <p>@{user.username}</p>
          {user.isOnline ? (
            <p className="status-text status-online">🟢 Online Now</p>
          ) : (
            <p className="status-text status-offline">⚪ Last seen: 2 hours ago</p>
          )}
        </div>
      </div>

      <div className="interaction-bar">
        {isLikedByThem && <div className="like-status-badge">✨ This user likes you!</div>}
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`action-btn ${isLikedByMe ? 'btn-unlike' : 'btn-like'}`} 
            onClick={handleLikeToggle}
          >
            {isLikedByMe ? '💔 Unlike' : '❤️ Like'}
          </button>
        </div>

        <div className="danger-actions">
          <button className="action-btn btn-danger" onClick={handleReport}>🚩 Report Fake</button>
          <button className="action-btn btn-danger" onClick={handleBlock}>🚫 Block</button>
        </div>
      </div>

      <div className="public-photos">
        <img src={user.profilePic} alt="Main profile" />
      </div>

      <div className="info-block">
        <h3>📍 Location</h3>
        <p>{user.location}</p>
      </div>

      <div className="info-block">
        <h3>📖 Biography</h3>
        <p>This is a placeholder biography for {user.firstName}. They love coffee and long walks.</p>
      </div>

      <div className="info-block">
        <h3>🏷️ Interests</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {user.tags.map((tag, idx) => (
            <span key={idx} style={{ background: '#F5EFEB', color: '#8A9A5B', padding: '0.4rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', border: '1px solid #8A9A5B' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PublicProfile;