import API_URL from '../config/api';

function Avatar({ user, size = 'md', onClick }) {
  const sizeMap = { sm: 32, md: 48, lg: 64, xl: 120 };
  const dimension = sizeMap[size] || 48;
  
  const avatarUrl = user?.profile_photo 
    ? (user.profile_photo.startsWith('http') ? user.profile_photo : `${API_URL.replace('/api', '')}${user.profile_photo}`)
    : `https://ui-avatars.com/api/?background=8baa5e&color=fff&rounded=true&name=${encodeURIComponent(user?.first_name || user?.username || 'User')}`;

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