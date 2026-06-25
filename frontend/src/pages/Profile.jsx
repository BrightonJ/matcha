import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import '../assets/css/profile.css';

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('edit');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profileData, setProfileData] = useState({ 
    gender: '', 
    sexualPreferences: 'bisexual', 
    bio: '', 
    locationCity: '',
    firstName: '',
    lastName: '',
    email: '',
    birthDate: ''
  });
  
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [photos, setPhotos] = useState([]);
  const [mainPhotoId, setMainPhotoId] = useState(null);
  const [viewers, setViewers] = useState([]);
  const [likers, setLikers] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const token = localStorage.getItem('token');

  const getPhotoUrl = (photo, isExternal) => {
    if (!photo) return '/default-avatar.png';
    if (isExternal) return photo;
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${photo}`;
  };
  
  const fetchAvailableTags = async () => {
    try {
      const response = await fetch(`${API_URL}/tags`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTags(data);
      }
    } catch (err) {
      console.error('Erreur chargement tags disponibles:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          gender: data.gender || '',
          sexualPreferences: data.sexual_preferences || 'bisexual',
          bio: data.bio || '',
          locationCity: data.location_city || '',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          birthDate: data.birth_date ? data.birth_date.split('T')[0] : ''
        });
      }
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    }
  };

  const fetchUserTags = async () => {
    try {
      const response = await fetch(`${API_URL}/tags/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTags(data.map(t => `#${t.name}`));
      }
    } catch (err) {
      console.error('Erreur chargement tags:', err);
    }
  };

  const fetchUserPhotos = async () => {
    try {
      const response = await fetch(`${API_URL}/photos/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
        const profilePhoto = data.find(p => p.is_profile);
        if (profilePhoto) setMainPhotoId(profilePhoto.id);
      }
    } catch (err) {
      console.error('Erreur chargement photos:', err);
    }
  };

  const fetchVisitors = async () => {
    try {
      const response = await fetch(`${API_URL}/profile/visitors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setViewers(data);
      }
    } catch (err) {
      console.error('Erreur chargement visiteurs:', err);
    }
  };

  const fetchLikers = async () => {
    try {
      const response = await fetch(`${API_URL}/likes/received`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikers(data);
      }
    } catch (err) {
      console.error('Erreur chargement likers:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUserTags();
    fetchAvailableTags();
    fetchUserPhotos();
    fetchVisitors();
    fetchLikers();
  }, []);

  const handleInputChange = (e) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addTagFromSelect = async () => {
    if (!selectedTag) return;
    
    const tagName = selectedTag;
    if (tags.includes(`#${tagName}`)) {
      setMessage({ type: 'error', text: 'Tag déjà ajouté' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/tags/me`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tagName })
      });
      
      if (response.ok) {
        setTags([...tags, `#${tagName}`]);
        setSelectedTag('');
        setMessage({ type: 'success', text: 'Tag ajouté' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Erreur' });
      }
    } catch (err) {
      console.error('Erreur ajout tag:', err);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const removeTag = async (indexToRemove) => {
    const tagToRemove = tags[indexToRemove].substring(1);
    try {
      const response = await fetch(`${API_URL}/tags/me/${tagToRemove}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setTags(tags.filter((_, index) => index !== indexToRemove));
        setMessage({ type: 'success', text: 'Tag supprimé' });
      }
    } catch (err) {
      console.error('Erreur suppression tag:', err);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 5) {
      setMessage({ type: 'error', text: 'Maximum 5 photos' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    setLoading(true);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('photo', file);
      
      try {
        const response = await fetch(`${API_URL}/photos/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          setPhotos(prev => [...prev, data.photo]);
          if (data.photo.is_profile) setMainPhotoId(data.photo.id);
          setMessage({ type: 'success', text: 'Photo ajoutée' });
        } else {
          const error = await response.json();
          setMessage({ type: 'error', text: error.error });
        }
      } catch (err) {
        console.error('Erreur upload:', err);
      }
    }
    
    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const setMainPhoto = async (photoId) => {
    try {
      const response = await fetch(`${API_URL}/photos/profile/${photoId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setMainPhotoId(photoId);
        setPhotos(photos.map(p => ({ ...p, is_profile: p.id === photoId })));
        setMessage({ type: 'success', text: 'Photo de profil mise à jour' });
      }
    } catch (err) {
      console.error('Erreur mise à jour photo de profil:', err);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const removePhoto = async (photoId, index) => {
    try {
      const response = await fetch(`${API_URL}/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setPhotos(photos.filter((_, i) => i !== index));
        if (mainPhotoId === photoId) setMainPhotoId(null);
        setMessage({ type: 'success', text: 'Photo supprimée' });
      }
    } catch (err) {
      console.error('Erreur suppression photo:', err);
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      setMessage({ type: 'info', text: '📍 Récupération de votre position...' });
      
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            
            const geoResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            
            let city = '';
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (geoData.address) {
                city = geoData.address.city || 
                       geoData.address.town || 
                       geoData.address.village || 
                       geoData.address.suburb ||
                       geoData.address.county ||
                       `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              } else {
                city = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
              }
            } else {
              city = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            }
            
            const gpsResponse = await fetch(`${API_URL}/location/gps`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ latitude, longitude, city })
            });
            
            if (!gpsResponse.ok) {
              throw new Error('Erreur lors de l\'envoi des coordonnées');
            }
            
            setProfileData(prev => ({ ...prev, locationCity: city }));
            
            const updateResponse = await fetch(`${API_URL}/profile/me`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                ...profileData,
                locationCity: city
              })
            });
            
            if (updateResponse.ok) {
              setMessage({ type: 'success', text: `📍 Localisation mise à jour : ${city}` });
            } else {
              setMessage({ type: 'success', text: `📍 Position GPS enregistrée : ${city}` });
            }
          } catch (err) {
            console.error('Erreur:', err);
            setMessage({ type: 'error', text: '❌ Erreur lors de la géolocalisation' });
          } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
          }
        },
        (error) => {
          console.error('Erreur GPS:', error);
          let errorMsg = '❌ Impossible d\'accéder à votre position.';
          if (error.code === 1) errorMsg = '❌ Vous avez refusé l\'accès à la géolocalisation.';
          if (error.code === 2) errorMsg = '❌ Position indisponible.';
          if (error.code === 3) errorMsg = '❌ Délai d\'attente dépassé.';
          setMessage({ type: 'error', text: errorMsg });
          setLoading(false);
          setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setMessage({ type: 'error', text: '❌ La géolocalisation n\'est pas supportée par votre navigateur.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/profile/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          bio: profileData.bio,
          gender: profileData.gender,
          sexualPreferences: profileData.sexualPreferences,
          locationCity: profileData.locationCity,
          birthDate: profileData.birthDate
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile saved!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Error saving profile' });
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
    
    setLoading(false);
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const PreviewProfile = ({ onClose }) => {
    const profilePhoto = photos.find(p => p.is_profile);
    const displayName = user?.username || 'You';
    
    const handleOverlayClick = (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };
    
    return (
      <div className="preview-overlay" onClick={handleOverlayClick}>
        <div className="preview-container">
          <div className="preview-header">
            <h3>{displayName}</h3>
            <button className="close-preview" onClick={onClose}>×</button>
          </div>
          <div className="preview-content">
            <div className="preview-photo">
              <img 
                src={getPhotoUrl(profilePhoto?.url, profilePhoto?.is_external)} 
                alt="Profile" 
              />
            </div>
            <div className="preview-info">
              <h2>{profileData.firstName} {profileData.lastName}</h2>
              <p className="preview-username">@{user?.username}</p>
              {profileData.locationCity && <p className="preview-location">📍 {profileData.locationCity}</p>}
              {profileData.bio && <p className="preview-bio">{profileData.bio}</p>}
              <div className="preview-tags">
                {tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Your Mug (Profile)</h2>
        <p>Manage your account and see your activity, {user?.username}!</p>
        <button className="preview-btn" onClick={() => setShowPreview(true)}>
          See my profile
        </button>
      </div>

      {showPreview && <PreviewProfile onClose={() => setShowPreview(false)} />}

      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}

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
                <label>First Name</label>
                <input type="text" name="firstName" value={profileData.firstName} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" value={profileData.lastName} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={profileData.email} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Birth Date</label>
                <input type="date" name="birthDate" value={profileData.birthDate} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={profileData.gender} onChange={handleInputChange}>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
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
              <button type="button" className="gps-btn" onClick={handleGetLocation} disabled={loading}>
                {loading ? '⏳ Localisation en cours...' : '📍 Locate me via GPS'}
              </button>
              <div className="form-group">
                <label>Manual Location (City)</label>
                <input type="text" name="locationCity" value={profileData.locationCity} onChange={handleInputChange} placeholder="Paris, Lyon, etc." />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Biography</h3>
            <div className="form-group">
              <textarea name="bio" value={profileData.bio} onChange={handleInputChange} rows="4" placeholder="Tell us about yourself..." />
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
              </div>
              <div className="add-tag-select">
                <select 
                  value={selectedTag} 
                  onChange={(e) => setSelectedTag(e.target.value)}
                >
                  <option value="">-- Select a tag to add --</option>
                  {availableTags
                    .filter(t => !tags.includes(`#${t.name}`))
                    .map(tag => (
                      <option key={tag.id} value={tag.name}>#{tag.name}</option>
                    ))}
                </select>
                <button type="button" className="add-tag-btn" onClick={addTagFromSelect}>+ Add Tag</button>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>Photos ({photos.length}/5)</h3>
            <div className="form-group">
              {photos.length < 5 && (
                <div className="upload-btn-wrapper">
                  <button type="button" className="upload-btn">➕ Add Photo</button>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={loading} />
                </div>
              )}
              <div className="photos-grid">
                {photos.map((photo, idx) => (
                  <div key={photo.id} className={`photo-preview-card ${photo.is_profile ? 'is-main' : ''}`}>
                    {photo.is_profile && <span className="main-badge">Main</span>}
                    <img src={getPhotoUrl(photo.url, photo.is_external)} alt="Preview" />
                    <div className="photo-actions">
                      {!photo.is_profile && (
                        <button type="button" className="photo-action-btn" onClick={() => setMainPhoto(photo.id)}>Main</button>
                      )}
                      <button type="button" className="photo-action-btn delete" onClick={() => removePhoto(photo.id, idx)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      )}

      {activeTab === 'viewers' && (
        <div className="history-list">
          {viewers.length > 0 ? (
            viewers.map(v => (
              <div key={v.visitor_id} className="history-item" onClick={() => navigate(`/profile/${v.visitor_id}`)} style={{ cursor: 'pointer' }}>
                <img src={v.profile_photo || '/default-avatar.png'} alt={v.username} />
                <div className="history-info">
                  <h4>{v.first_name} {v.last_name} (@{v.username})</h4>
                  <p>Viewed your profile on {formatDate(v.viewed_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-message">No one has visited your profile yet.</p>
          )}
        </div>
      )}

      {activeTab === 'likers' && (
        <div className="history-list">
          {likers.length > 0 ? (
            likers.map(l => (
              <div key={l.id} className="history-item" onClick={() => navigate(`/profile/${l.from_user_id}`)} style={{ cursor: 'pointer' }}>
                <img src={l.profile_photo || '/default-avatar.png'} alt={l.username} />
                <div className="history-info">
                  <h4>{l.first_name} {l.last_name} (@{l.username})</h4>
                  <p>Liked you on {formatDate(l.created_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-message">No one has liked you yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;
