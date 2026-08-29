import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import API_URL from '../config/api';
import '../assets/css/chat.css';

function Chat() {
  const [activeMatch, setActiveMatch] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState({});
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = useSocket();
  const location = useLocation();
  
  const token = localStorage.getItem('token');

  // Gestion des événements WebSockets
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      const otherUserId = message.from_user_id === socket.userId 
        ? message.to_user_id 
        : message.from_user_id;
      
      setMessages(prev => ({
        ...prev,
        [otherUserId]: [...(prev[otherUserId] || []), message]
      }));
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      if (activeMatch?.id === otherUserId) {
        socket.emit('mark_read', { fromUserId: otherUserId });
      }
    };

    const handleUserStatus = (data) => {
      setMatches(prev => prev.map(match => 
        match.id === data.userId 
          ? { ...match, is_online: data.isOnline }
          : match
      ));
      
      if (activeMatch && activeMatch.id === data.userId) {
        setActiveMatch(prev => ({ ...prev, is_online: data.isOnline }));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_status', handleUserStatus);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_status', handleUserStatus);
    };
  }, [socket, activeMatch]);

  // Récupération de la liste des matchs
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const response = await fetch(`${API_URL}/likes/matches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setMatches(data);
        }
      } catch (err) {
        // Erreur ignorée silencieusement pour la console
      }
    };
    
    if (token) {
      fetchMatches();
    }
  }, [token]);

  // Ouverture automatique si on vient du profil d'un match (via navigate state)
  useEffect(() => {
    if (matches.length > 0 && location.state?.matchId) {
      const matchToSelect = matches.find(m => m.id === location.state.matchId);
      if (matchToSelect && (!activeMatch || activeMatch.id !== matchToSelect.id)) {
        selectMatch(matchToSelect);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, location.state]);

  const fetchConversation = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => ({
          ...prev,
          [userId]: data
        }));
      }
    } catch (err) {
      // Ignoré silencieusement
    } finally {
      setLoading(false);
    }
  };

  const selectMatch = async (match) => {
    setActiveMatch(match);
    
    if (!messages[match.id]) {
      await fetchConversation(match.id);
    }
    
    if (socket) {
      socket.emit('mark_read', { fromUserId: match.id });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeMatch || !socket) return;
    
    const newMessage = {
      toUserId: activeMatch.id,
      content: messageText
    };
    
    socket.emit('send_message', newMessage, (response) => {
      if (response && response.success) {
        setMessages(prev => ({
          ...prev,
          [activeMatch.id]: [...(prev[activeMatch.id] || []), response.message]
        }));
        
        setMessageText('');
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else if (response && response.error) {
        alert(response.error);
      }
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeMatch]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getProfilePhoto = (match) => {
    if (match.profile_photo) {
      return `${API_URL.replace('/api', '')}${match.profile_photo}`;
    }
    return `https://ui-avatars.com/api/?background=8baa5e&color=fff&rounded=true&name=${encodeURIComponent(match.first_name || match.username || 'User')}`;
  };

  if (matches.length === 0) {
    return (
      <div className="chat-container">
        <div className="empty-chat">
          <h3>Pas encore de matchs</h3>
          <p>Commencez à liker des profils pour pouvoir discuter !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Vos Matchs ({matches.length})</h2>
        </div>
        <div className="matches-list">
          {matches.map(match => (
            <div 
              key={match.id} 
              className={`match-item ${activeMatch?.id === match.id ? 'active' : ''}`}
              onClick={() => selectMatch(match)}
            >
              <img 
                src={getProfilePhoto(match)} 
                alt={match.username} 
              />
              <div className="match-info">
                <h4>{match.first_name} {match.last_name}</h4>
                <p>@{match.username}</p>
                {match.is_online && <span className="online-badge">🟢 En ligne</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {activeMatch ? (
          <>
            <div className="chat-header">
              <img 
                src={getProfilePhoto(activeMatch)} 
                alt={activeMatch.username} 
              />
              <div className="chat-header-info">
                <h3>{activeMatch.first_name} {activeMatch.last_name}</h3>
                <p>@{activeMatch.username}</p>
                {activeMatch.is_online ? (
                  <span className="online-badge">🟢 En ligne</span>
                ) : (
                  <span className="offline-badge">⚪ Hors ligne</span>
                )}
              </div>
            </div>
            
            <div className="chat-messages">
              {loading ? (
                <div className="loading-messages">Chargement de l'historique...</div>
              ) : (
                <>
                  {(messages[activeMatch.id] || []).map((msg, idx) => (
                    <div 
                      key={msg.id || idx} 
                      className={`message-bubble ${msg.from_user_id === activeMatch.id ? 'received' : 'sent'}`}
                    >
                      <p>{msg.content}</p>
                      <span className="message-time">{formatTime(msg.created_at)}</span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Écrivez un message..." 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button type="submit" className="send-btn" disabled={!socket}>
                Envoyer
              </button>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <h3>Sélectionnez un match pour discuter</h3>
            <p>La conversation n'attend plus que vous...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;