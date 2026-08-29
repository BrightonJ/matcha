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
    gender: '', sexualPreferences: 'bisexual', bio: '', locationCity: '',
    firstName: '', lastName: '', email: '', birthDate: ''
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
    } catch (err) {}
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
    } catch (err) {}
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
    } catch (err) {}
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
    } catch (err) {}
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
    } catch (err) {}
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
    } catch (err) {}
  };

  useEffect(() => {
    fetchProfile();
    fetchUserTags();
    fetchAvailableTags();
    fetchUserPhotos();
    fetchVisitors();
    fetchLikers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/profile/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Profil mis à jour' });
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur serveur' });
    }
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const addTagFromSelect = async () => {
    if (!selectedTag) return;
    const tagName = selectedTag.replace('#', '');
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
    } catch (err) {}
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
    } catch (err) {}
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
      } catch (err) {}
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
    } catch (err) {}
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
    } catch (err) {}
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleGetLocation = () => {
    setLoading(true);
    setMessage({ type: 'info', text: '📍 Localisation en cours...' });

    const saveLocationToDB = async (lat, lon, cityStr) => {
      try {
        const gpsResponse = await fetch(`${API_URL}/location/gps`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ latitude: lat, longitude: lon, city: cityStr })
        });
        if (!gpsResponse.ok) throw new Error('Erreur API');
        setProfileData(prev => ({ ...prev, locationCity: cityStr }));
        await fetch(`${API_URL}/profile/me`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...profileData, locationCity: cityStr })
        });
        setMessage({ type: 'success', text: `📍 Localisation mise à jour : ${cityStr}` });
      } catch (err) {
        setMessage({ type: 'error', text: '❌ Erreur de sauvegarde' });
      } finally {
        setLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      }
    };

    const fallbackToIP = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.latitude && data.longitude) {
          saveLocationToDB(data.latitude, data.longitude, data.city || 'Position IP');
        } else {
          throw new Error('IP API failed');
        }
      } catch (err) {
        setMessage({ type: 'error', text: '❌ Impossible de vous localiser.' });
        setLoading(false);
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`);
            let city = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (geoData.address) {
                city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.suburb || geoData.address.county || city;
              }
            }
            saveLocationToDB(latitude, longitude, city);
          } catch (e) {
            fallbackToIP();
          }
        },
        () => {
          fallbackToIP();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      fallbackToIP();
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Mon Profil</h2>
        <button className="preview-btn" onClick={() => setShowPreview(true)}>Voir l'aperçu public</button>
      </div>

      {message.text && (
        <div className={`message-banner ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-tabs">
        <button className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`} onClick={() => setActiveTab('edit')}>Informations</button>
        <button className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>Photos</button>
        <button className={`tab-btn ${activeTab === 'tags' ? 'active' : ''}`} onClick={() => setActiveTab('tags')}>Tags</button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Historique</button>
      </div>

      {activeTab === 'edit' && (
        <div className="profile-section">
          <form onSubmit={handleProfileSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Prénom</label>
                <input type="text" name="firstName" value={profileData.firstName} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Nom</label>
                <input type="text" name="lastName" value={profileData.lastName} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={profileData.email} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Date de naissance</label>
                <input type="date" name="birthDate" value={profileData.birthDate} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Genre</label>
                <select name="gender" value={profileData.gender} onChange={handleInputChange} required>
                  <option value="">Sélectionner</option>
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="form-group">
                <label>Préférence</label>
                <select name="sexualPreferences" value={profileData.sexualPreferences} onChange={handleInputChange}>
                  <option value="male">Hommes</option>
                  <option value="female">Femmes</option>
                  <option value="bisexual">Les deux</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Biographie</label>
                <textarea name="bio" value={profileData.bio} onChange={handleInputChange} required />
              </div>
            </div>
            
            <div className="location-container" style={{ marginTop: '1.5rem' }}>
              <label>Localisation actuelle : {profileData.locationCity || 'Non définie'}</label>
              <button type="button" className="gps-btn" onClick={handleGetLocation} disabled={loading}>
                Mettre à jour ma position GPS
              </button>
            </div>

            <button type="submit" className="save-btn" disabled={loading}>Sauvegarder les modifications</button>
          </form>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="profile-section">
          <div className="upload-btn-wrapper">
            <button className="upload-btn">Ajouter une photo (Max 5)</button>
            <input type="file" accept="image/jpeg, image/png, image/jpg" multiple onChange={handlePhotoUpload} disabled={loading || photos.length >= 5} />
          </div>
          <div className="photos-grid">
            {photos.map((p, index) => (
              <div key={p.id} className={`photo-preview-card ${p.is_profile ? 'is-main' : ''}`}>
                {p.is_profile && <span className="main-badge">Principale</span>}
                <img src={getPhotoUrl(p.url, p.is_external)} alt={`Photo ${index}`} />
                <div className="photo-actions">
                  {!p.is_profile && <button className="photo-action-btn" onClick={() => setMainPhoto(p.id)}>Définir</button>}
                  <button className="photo-action-btn delete" onClick={() => removePhoto(p.id, index)}>X</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="profile-section">
          <div className="tags-input-container">
            {tags.map((tag, index) => (
              <div key={index} className="tag-pill">
                {tag} <button className="tag-remove" onClick={() => removeTag(index)}>&times;</button>
              </div>
            ))}
          </div>
          <div className="add-tag-select">
            <input type="text" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} placeholder="Nouveau tag (ex: 42paris)" />
            <button className="add-tag-btn" onClick={addTagFromSelect}>Ajouter</button>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="profile-section">
          <h3>Derniers Visiteurs</h3>
          <div className="history-list">
            {viewers.length > 0 ? viewers.map((v, i) => (
              <div key={i} className="history-item" onClick={() => navigate(`/profile/${v.visitor_id}`)}>
                <img src={getPhotoUrl(v.profile_photo, false)} alt={v.username} />
                <div className="history-info">
                  <h4>{v.first_name}</h4>
                  <p>@{v.username} - {new Date(v.viewed_at).toLocaleDateString()}</p>
                </div>
              </div>
            )) : <p className="empty-message">Aucun visiteur pour le moment.</p>}
          </div>

          <h3 style={{ marginTop: '2rem' }}>Derniers Likes reçus</h3>
          <div className="history-list">
            {likers.length > 0 ? likers.map((l, i) => (
              <div key={i} className="history-item" onClick={() => navigate(`/profile/${l.from_user_id}`)}>
                <img src={getPhotoUrl(l.profile_photo, false)} alt={l.username} />
                <div className="history-info">
                  <h4>{l.first_name}</h4>
                  <p>@{l.username} - {new Date(l.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )) : <p className="empty-message">Aucun like pour le moment.</p>}
          </div>
        </div>
      )}

      {showPreview && (
        <div className="preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="preview-container" onClick={e => e.stopPropagation()}>
            <div className="preview-header">
              <h3>Aperçu Public</h3>
              <button className="close-preview" onClick={() => setShowPreview(false)}>&times;</button>
            </div>
            <div className="preview-content">
              <div className="preview-photo">
                <img src={getPhotoUrl(photos.find(p => p.is_profile)?.url, photos.find(p => p.is_profile)?.is_external)} alt="Profile" />
              </div>
              <div className="preview-info">
                <h2>{profileData.firstName} {profileData.lastName}</h2>
                <p className="preview-username">@{user?.username}</p>
                <p className="preview-location">📍 {profileData.locationCity}</p>
                <p className="preview-bio">"{profileData.bio}"</p>
                <div className="preview-tags">
                  {tags.map((t, i) => <span key={i} className="tag-pill">{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;