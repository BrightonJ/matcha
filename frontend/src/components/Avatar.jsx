import { useEffect, useState } from 'react';
import API_URL from '../config/api';

function Avatar({ user, size = 'md', onClick }) {
  const [mockPhoto, setMockPhoto] = useState(null);

  useEffect(() => {
    // Dans le cadre du mock, on vérifie régulièrement si une nouvelle photo a été uploadée
    const checkMockPhoto = () => {
      const savedPhotos = JSON.parse(localStorage.getItem('mockProfilePhotos') || '[]');
      if (savedPhotos.length > 0 && savedPhotos[0] !== mockPhoto) {
        setMockPhoto(savedPhotos[0]);
      } else if (savedPhotos.length === 0 && mockPhoto !== null) {
        setMockPhoto(null);
      }
    };

    checkMockPhoto();
    // Petit intervalle pour simuler la réactivité du mock
    const intervalId = setInterval(checkMockPhoto, 1000);
    return () => clearInterval(intervalId);
  }, [mockPhoto]);

  const sizeMap = { sm: 32, md: 48, lg: 64, xl: 120 };
  const dimension = sizeMap[size] || 48;
  
  const avatarUrl = mockPhoto || (user?.profile_photo 
    ? `${API_URL.replace('/api', '')}${user.profile_photo}` 
    : `https://ui-avatars.com/api/?background=8baa5e&color=fff&rounded=true&name=${encodeURIComponent(user?.first_name || user?.username || 'User')}`);

  return (
    <img 
      src={avatarUrl}
      alt={user?.username || 'Avatar'}
      className={`avatar avatar-${size}`}
      style={{ 
        width: dimension, 
        height: dimension, 
        borderRadius: '50%', 
        objectFit: 'cover',
        cursor: onClick ? 'pointer' : 'default',
        border: '2px solid var(--color-sunlight)'
      }}
      onClick={onClick}
    />
  );
}

export default Avatar;