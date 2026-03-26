import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import mockUsers from '../mocks/users.json';
import '../assets/css/profile.css';

function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('edit');
  
  const [profileData, setProfileData] = useState({ gender: '', preference: 'bisexual', bio: '', location: '' });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [photos, setPhotos] = useState([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [gpsStatus, setGpsStatus] = useState({ type: '', message: '' });

  const mockViewers = [mockUsers[0], mockUsers[1]];
  const mockLikers = [mockUsers[1]];

  const handleInputChange = (e) => setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      let newTag = tagInput.trim().toLowerCase();
      if (newTag && !newTag.startsWith('#')) newTag = '#' + newTag;
      if (newTag.length > 1 && !tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (indexToRemove) => setTags(tags.filter((_, index) => index !== indexToRemove));

  const handleGetLocation = () => {
    setGpsStatus({ type: 'loading', message: 'Locating...' });
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsStatus({ type: 'success', message: 'GPS Location acquired!' });
          setProfileData(prev => ({ ...prev, location: `Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}` }));
        },
        () => {
          setGpsStatus({ type: 'error', message: 'GPS access denied.' });
        }
      );
    } else {
      setGpsStatus({ type: 'error', message: 'Geolocation is not supported.' });
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) return alert("Maximum 5 photos.");
    setPhotos(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
    if (mainPhotoIndex === index) setMainPhotoIndex(0);
    else if (mainPhotoIndex > index) setMainPhotoIndex(prev => prev - 1);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!profileData.location) return alert("Location is required.");
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Your Mug (Profile)</h2>
        <p>Manage your account and see your activity, {user?.username}!</p>
      </div>

      <div className="profile-tabs">
        <button className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>Edit Profile</button>
        <button className={`tab-btn ${activeTab === 'viewers' ? 'active' : ''}`} onClick={() => setActiveTab('viewers')}>Who Viewed Me?</button>
        <button className={`tab-btn ${activeTab === 'likers' ? 'active' : ''}`} onClick={() => setActiveTab('likers')}>Who Liked Me?</button>
      </div>

      {activeTab === 'edit' && (
        <form onSubmit={handleSaveProfile}>
          <div className="profile-section">
            <h3>Basic Info</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={profileData.gender} onChange={handleInputChange} required>
                  <option value="" disabled>Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>
              <div className="form-group">
                <label>Looking for</label>
                <select name="preference" value={profileData.preference} onChange={handleInputChange}>
                  <option value="bisexual">Everyone</option>
                  <option value="male">Men</option>
                  <option value="female">Women</option>
                </select>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Location</h3>
            <div className="location-container">
              <button type="button" className="gps-btn" onClick={handleGetLocation}>📍 Locate me via GPS</button>
              {gpsStatus.message && <span className={`gps-status ${gpsStatus.type}`}>{gpsStatus.message}</span>}
              <div className="form-group">
                <label>Manual Location</label>
                <input type="text" name="location" value={profileData.location} onChange={handleInputChange} required />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Biography</h3>
            <div className="form-group">
              <textarea name="bio" value={profileData.bio} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="profile-section">
            <h3>Interests (Tags)</h3>
            <div className="form-group">
              <div className="tags-input-container">
                {tags.map((tag, idx) => (
                  <div key={idx} className="tag-pill">
                    {tag}
                    <button type="button" className="tag-remove" onClick={() => removeTag(idx)}>&times;</button>
                  </div>
                ))}
                <input type="text" className="tag-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Photos ({photos.length}/5)</h3>
            <div className="form-group">
              {photos.length < 5 && (
                <div className="upload-btn-wrapper">
                  <button type="button" className="upload-btn">➕ Add Photo</button>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} />
                </div>
              )}
              <div className="photos-grid">
                {photos.map((url, idx) => (
                  <div key={idx} className={`photo-preview-card ${mainPhotoIndex === idx ? 'is-main' : ''}`}>
                    {mainPhotoIndex === idx && <span className="main-badge">Main</span>}
                    <img src={url} alt="" />
                    <div className="photo-actions">
                      {mainPhotoIndex !== idx && <button type="button" className="photo-action-btn" onClick={() => setMainPhotoIndex(idx)}>Main</button>}
                      <button type="button" className="photo-action-btn delete" onClick={() => removePhoto(idx)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button type="submit" className="save-btn">Save Profile</button>
        </form>
      )}

      {activeTab === 'viewers' && (
        <div className="history-list">
          {mockViewers.map(u => (
            <div key={u.id} className="history-item">
              <img src={u.profilePic} alt={u.username} />
              <div className="history-info">
                <h4>{u.username}</h4>
                <p>Viewed your profile 2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'likers' && (
        <div className="history-list">
          {mockLikers.map(u => (
            <div key={u.id} className="history-item">
              <img src={u.profilePic} alt={u.username} />
              <div className="history-info">
                <h4>{u.username}</h4>
                <p>Liked you yesterday</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profile;