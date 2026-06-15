import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../assets/css/login.css';
import matchaGif from '../assets/images/matcha.gif';

const FORBIDDEN_WORDS = ['password', '123456', 'qwerty', 'admin', 'welcome', 'love', 'coffee'];

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    password: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const validatePassword = (password) => {
    if (password.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain a number.";

    const lowerPass = password.toLowerCase();
    const containsForbidden = FORBIDDEN_WORDS.some(word => lowerPass.includes(word));
    if (containsForbidden) return "Password contains a common or forbidden word.";

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (isRegister) {
      const passError = validatePassword(formData.password);
      if (passError) {
        setErrorMsg(passError);
        setIsLoading(false);
        return;
      }

      const result = await register({
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password
      });

      if (result.success) {
        setRegistrationSuccess(true);
      } else {
        setErrorMsg(result.error);
      }
    } else {
      if (!formData.username || !formData.password) {
        setErrorMsg("Please fill in all fields.");
        setIsLoading(false);
        return;
      }

      const result = await login(formData.username, formData.password);

      if (result.success) {
        navigate('/search');
      } else {
        setErrorMsg(result.error);
      }
    }
    setIsLoading(false);
  };

  const handleForgotPasswordSubmit = (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrorMsg("Please enter your email.");
      return;
    }
    setResetSent(true);
    setErrorMsg('');
  };

  if (registrationSuccess) {
    return (
      <div className="auth-container" style={{ backgroundImage: `url(${matchaGif})` }}>
        <div className="auth-overlay">
          <div className="auth-card success-card">
            <h1 className="auth-title">Brewing Complete!</h1>
            <p className="success-message">
              Your account has been created. Please check your email ({formData.email}) for a verification link to activate your account.
            </p>
            <button className="auth-submit-btn" onClick={() => {
              setRegistrationSuccess(false);
              setIsRegister(false);
            }}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="auth-container" style={{ backgroundImage: `url(${matchaGif})` }}>
        <div className="auth-overlay">
          <div className="auth-card">
            <h1 className="auth-title">Reset Password</h1>

            {resetSent ? (
              <div className="success-message">
                If an account exists for {resetEmail}, a reset link has been sent.
              </div>
            ) : (
              <>
                <h2 className="auth-subtitle">We'll send you a reset link</h2>
                {errorMsg && <div className="auth-error-box">{errorMsg}</div>}
                <form onSubmit={handleForgotPasswordSubmit} className="auth-form">
                  <div className="input-group">
                    <label htmlFor="resetEmail">Email</label>
                    <input
                      type="email" id="resetEmail" value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="barista@matcha.com" required
                    />
                  </div>
                  <button type="submit" className="auth-submit-btn">Send Link</button>
                </form>
              </>
            )}

            <div className="auth-toggle-section">
              <button
                type="button" className="forgot-password-btn"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                  setErrorMsg('');
                }}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container" style={{ backgroundImage: `url(${matchaGif})` }}>
      <div className="auth-overlay">
        <div className="auth-card">
          <h1 className="auth-title">Matcha Cafe</h1>
          <h2 className="auth-subtitle">
            {isRegister ? 'Join the Club' : 'Welcome Back'}
          </h2>

          {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <>
                <div className="input-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="barista@matcha.com" required={isRegister} />
                </div>
                <div className="input-group">
                  <label htmlFor="firstName">First Name</label>
                  <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" required={isRegister} />
                </div>
                <div className="input-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" required={isRegister} />
                </div>
              </>
            )}

            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="CoffeeLover99" required />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" required />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? 'Loading...' : (isRegister ? 'Brew My Account' : 'Login')}
            </button>
          </form>

          <div className="auth-toggle-section">
            <p>
              {isRegister ? 'Already have a mug?' : "Don't have an account?"}
              <button
                type="button"
                className="auth-toggle-btn"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg('');
                }}
              >
                {isRegister ? ' Login here' : ' Register here'}
              </button>
            </p>
            {!isRegister && (
              <button
                type="button"
                className="forgot-password-btn"
                onClick={() => {
                  setShowForgotPassword(true);
                  setErrorMsg('');
                }}
              >
                Forgot Password?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
