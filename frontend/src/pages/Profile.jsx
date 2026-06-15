import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../assets/css/profile.css';

function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profileData, setProfileData] = useState({ 
    firstName: '', lastName: '', email: '', bio: '', 
    gender: '', sexualPreferences: 'bisexual', locationCity: '', birthDate: ''
  });
  
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  
  const [photos, setPhotos] = useState([]);
  const [mainPhotoIdx, setMainPhotoIdx] = useState(0);

  useEffect(() => {
    const savedProfile = localStorage.getItem('mockProfileData');
    const savedTags = localStorage.getItem('mockProfileTags');
    const savedPhotos = localStorage.getItem('mockProfilePhotos');
    
    if (savedProfile) setProfileData(JSON.parse(savedProfile));
    if (savedTags) setTags(JSON.parse(savedTags));
    if (savedPhotos) setPhotos(JSON.parse(savedPhotos));
  }, []);

  const handleInputChange = (e) => setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      let newTag = tagInput.trim().toLowerCase();
      if (newTag && !newTag.startsWith('#')) newTag = '#' + newTag;
      if (newTag.length > 1 && !tags.includes(newTag)) {
        const updatedTags = [...tags, newTag];
        setTags(updatedTags);
        localStorage.setItem('mockProfileTags', JSON.stringify(updatedTags));
      }
      setTagInput('');
    }
  };

  const removeTag = (idx) => {
    const newTags = tags.filter((_, i) => i !== idx);
    setTags(newTags);
    localStorage.setItem('mockProfileTags', JSON.stringify(newTags));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (photos.length + files.length > 5) {
      setMessage({ type: 'error', text: 'Maximum 5 photos autorisées !' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }

    files.forEach(file => {
      if (file.type.match('image/jpeg') || file.type.match('image/jpg') || file.type.match('image/png')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPhotos(prev => {
            const newPhotos = [...prev, event.target.result];
            localStorage.setItem('mockProfilePhotos', JSON.stringify(newPhotos));
            return newPhotos;
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (idxToRemove) => {
    setPhotos(prev => {
      const newPhotos = prev.filter((_, idx) => idx !== idxToRemove);
      localStorage.setItem('mockProfilePhotos', JSON.stringify(newPhotos));
      if (mainPhotoIdx === idxToRemove) setMainPhotoIdx(0); 
      return newPhotos;
    });
  };

  const handleGetLocation = () => {
    if (!("geolocation" in navigator)) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        setProfileData(prev => ({ ...prev, locationCity: `Paris (GPS: ${lat}, ${lon})` }));
        setLoading(false);
      },
      () => { setLoading(false); }
    );
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('mockProfileData', JSON.stringify(profileData));
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }, 800);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Account Settings</h2>
        <p>Complete your information to appear in searches.</p>
      </div>

      {message.text && <div className={`message-banner ${message.type}`}>{message.text}</div>}

      <form onSubmit={handleSaveProfile}>
        <div className="profile-section">
          <h3>Vos Photos ({photos.length}/5)</h3>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>La première photo encadrée en vert est votre photo de profil publique.</p>
          
          <div className="photos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {photos.map((photo, idx) => (
              <div key={idx} style={{ 
                position: 'relative', 
                border: mainPhotoIdx === idx ? '4px solid var(--color-matcha)' : '1px solid #ccc',
                borderRadius: '8px', 
                overflow: 'hidden' 
              }}>
                {mainPhotoIdx === idx && <span style={{ position: 'absolute', top: 5, left: 5, background: 'var(--color-matcha)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>Main</span>}
                <img src={photo} alt={`Upload ${idx}`} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                
                <div style={{ display: 'flex', position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)' }}>
                  {mainPhotoIdx !== idx && (
                    <button type="button" onClick={() => setMainPhotoIdx(idx)} style={{ flex: 1, padding: '5px', background: 'transparent', color: 'white', fontSize: '0.8rem' }}>Set Main</button>
                  )}
                  <button type="button" onClick={() => removePhoto(idx)} style={{ flex: 1, padding: '5px', background: 'transparent', color: 'var(--color-error)', fontSize: '0.8rem', fontWeight: 'bold' }}>Supprimer</button>
                </div>
              </div>
            ))}
            
            {photos.length < 5 && (
              <label style={{ 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                height: '150px', border: '2px dashed var(--color-matcha)', borderRadius: '8px', cursor: 'pointer',
                backgroundColor: 'var(--color-cream)', color: 'var(--color-matcha)', fontWeight: 'bold'
              }}>
                <span>+ Ajouter</span>
                <input type="file" accept="image/jpeg, image/jpg, image/png" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h3>Basic Info</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" name="firstName" value={profileData.firstName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="lastName" value={profileData.lastName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={profileData.email} disabled style={{ backgroundColor: '#f5f5f5', color: '#888' }} />
            </div>
            <div className="form-group">
              <label>Birth Date</label>
              <input type="date" name="birthDate" value={profileData.birthDate} disabled style={{ backgroundColor: '#f5f5f5', color: '#888' }} />
            </div>
            <div className="form-group">
              <label>Your Gender</label>
              <select name="gender" value={profileData.gender} onChange={handleInputChange} required>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label>Looking for</label>
              <select name="sexualPreferences" value={profileData.sexualPreferences} onChange={handleInputChange}>
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
            <button type="button" className="gps-btn" onClick={handleGetLocation}>{loading ? '⏳...' : '📍 Locate me via GPS'}</button>
            <div className="form-group">
              <input type="text" name="locationCity" value={profileData.locationCity} onChange={handleInputChange} placeholder="Manual city input" required />
            </div>
          </div>
        </div>

        <div className="profile-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
            <h3>Biography</h3>
            <small style={{ color: profileData.bio.length >= 500 ? 'red' : '#888' }}>
              {profileData.bio.length} / 500
            </small>
          </div>
          <div className="form-group">
            <textarea 
              name="bio" 
              value={profileData.bio} 
              onChange={handleInputChange} 
              rows="4" 
              maxLength="500"
              placeholder="Tell us about yourself..." 
              required
            />
          </div>
        </div>

        <div className="profile-section">
          <h3>Interests (Tags)</h3>
          <div className="form-group">
            <div className="tags-input-container">
              {tags.map((tag, idx) => (
                <div key={idx} className="tag-pill">{tag} <button type="button" className="tag-remove" onClick={() => removeTag(idx)}>&times;</button></div>
              ))}
              <input 
                type="text" 
                value={tagInput} 
                onChange={(e) => setTagInput(e.target.value)} 
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? "Type and press space" : ""}
                style={{ border: 'none', outline: 'none', flex: 1, minWidth: '150px', padding: '0.5rem', background: 'transparent' }}
              />
            </div>
          </div>
        </div>
        
        <button type="submit" className="save-btn" disabled={loading}>
          {loading ? 'Saving Changes...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}

export default Profile;