import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API_URL from '../config/api';
import '../assets/css/login.css';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd) => {
    const forbiddenWords = ['password', 'coffee', 'love', '123456', 'azerty', 'qwerty'];
    const lowerPwd = pwd.toLowerCase();
    if (forbiddenWords.some(word => lowerPwd.includes(word))) return false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (passwords.newPassword !== passwords.confirmPassword) {
      setStatus({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    if (!validatePassword(passwords.newPassword)) {
      setStatus({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: passwords.newPassword })
      });
      
      const data = await response.json();
      if (response.ok) {
        setStatus({ type: 'success', text: data.message });
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setStatus({ type: 'error', text: data.error });
      }
    } catch (err) {
      setStatus({ type: 'error', text: 'Erreur serveur.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Matcha</h1>
        <h2>Nouveau mot de passe</h2>
        
        {status.type === 'error' && <div className="error-message">{status.text}</div>}
        {status.type === 'success' && <div className="success-message">{status.text}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Chargement...' : 'Réinitialiser'}
          </button>
        </form>
        <Link to="/login" className="toggle-auth" style={{ display: 'block', marginTop: '1rem' }}>
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

export default ResetPassword;