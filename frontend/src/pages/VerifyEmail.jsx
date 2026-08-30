import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API_URL from '../config/api';
import '../assets/css/login.css'; 

function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('idle'); 
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    setStatus('loading');
    try {
      const response = await fetch(`${API_URL}/auth/verify/${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Une erreur est survenue lors de la vérification.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Matcha</h1>
        <h2>Vérification de l'email</h2>
        
        {status === 'idle' && (
          <>
            <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email.</p>
            <button onClick={handleVerify} style={{ width: '100%', marginTop: '1rem' }}>
              Confirmer mon email
            </button>
          </>
        )}

        {status === 'loading' && <p>Vérification en cours...</p>}
        {status === 'success' && <div className="success-message">{message}</div>}
        {status === 'error' && <div className="error-message">{message}</div>}
        
        {status !== 'idle' && status !== 'loading' && (
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={{ marginTop: '1rem', width: '100%' }}>Aller à la connexion</button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;