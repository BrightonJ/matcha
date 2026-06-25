import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../assets/css/login.css';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (pwd) => {
    const forbiddenWords = ['password', 'coffee', 'love', '123456', 'azerty', 'qwerty'];
    const lowerPwd = pwd.toLowerCase();
    if (forbiddenWords.some(word => lowerPwd.includes(word))) return false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;
    return regex.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (isLogin) {
      const result = await login(formData.username, formData.password);
      if (result.success) {
        navigate('/search');
      } else {
        setError(result.error);
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError('Les deux mots de passe ne sont pas identiques.');
        setLoading(false);
        return;
      }
      if (!validatePassword(formData.password)) {
        setError('Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre, et aucun mot commun.');
        setLoading(false);
        return;
      }
      const result = await register({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      if (result.success) {
        setMessage(result.message || 'Inscription réussie. Veuillez vérifier votre email.');
        setIsLogin(true);
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          email: '',
          firstName: '',
          lastName: ''
        });
      } else {
        setError(result.error);
      }
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Matcha</h1>
        <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="name-grid">
              <input
                type="text"
                name="firstName"
                placeholder="Prénom"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Nom"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          )}
          
          {!isLogin && (
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          )}

          <input
            type="text"
            name="username"
            placeholder="Nom d'utilisateur"
            value={formData.username}
            onChange={handleChange}
            required
          />
          
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {!isLogin && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <p className="toggle-auth" onClick={() => {
          setIsLogin(!isLogin);
          setError('');
          setMessage('');
        }}>
          {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </p>
      </div>
    </div>
  );
}

export default Login;