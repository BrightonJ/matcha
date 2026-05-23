import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API_URL from '../config/api';
import '../assets/css/chat.css';

function Chat() {
  const [activeMatch, setActiveMatch] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState({});
  const [matches, setMatches] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  const token = localStorage.getItem('token');

  // Initialiser Socket.io
  useEffect(() => {
    const newSocket = io(API_URL.replace('/api', ''), {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
    });
    
    newSocket.on('new_message', (message) => {
      console.log('New message received:', message);
      
      // Ajouter le message à la conversation
      setMessages(prev => {
        const otherUserId = message.from_user_id === activeMatch?.id 
          ? message.from_user_id 
          : message.to_user_id;
        
        return {
          ...prev,
          [otherUserId]: [...(prev[otherUserId] || []), message]
        };
      });
      
      // Notification sonore (optionnel)
      if (message.from_user_id !== activeMatch?.id) {
        // Jouer un son ou une notification
      }
    });
    
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, [token]);

  // Récupérer les matchs et les conversations
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
        console.error('Erreur récupération matchs:', err);
      }
    };
    
    fetchMatches();
  }, [token]);

  // Récupérer les messages d'une conversation
  const fetchConversation = async (userId) => {
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
      console.error('Erreur récupération messages:', err);
    }
  };

  // Sélectionner un match
  const selectMatch = async (match) => {
    setActiveMatch(match);
    setLoading(true);
    
    if (!messages[match.id]) {
      await fetchConversation(match.id);
    }
    
    setLoading(false);
  };

  // Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeMatch || !socket) return;
    
    const newMessage = {
      toUserId: activeMatch.id,
      content: messageText,
      timestamp: new Date()
    };
    
    // Envoyer via Socket.io
    socket.emit('send_message', newMessage, (response) => {
      if (response.success) {
        // Ajouter le message à l'UI
        setMessages(prev => ({
          ...prev,
          [activeMatch.id]: [...(prev[activeMatch.id] || []), response.message]
        }));
        
        // Marquer comme lu
        socket.emit('mark_read', { fromUserId: activeMatch.id });
      } else {
        console.error('Erreur envoi:', response.error);
      }
    });
    
    setMessageText('');
  };

  // Marquer les messages comme lus quand la conversation est ouverte
  useEffect(() => {
    if (activeMatch && socket) {
      socket.emit('mark_read', { fromUserId: activeMatch.id });
    }
  }, [activeMatch, socket]);

  // Scroll vers le bas quand nouveaux messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (matches.length === 0) {
    return (
      <div className="chat-container">
        <div className="empty-chat">
          <h3>No matches yet</h3>
          <p>Start liking profiles to find your coffee partner!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Your Matches ({matches.length})</h2>
        </div>
        <div className="matches-list">
          {matches.map(match => (
            <div 
              key={match.id} 
              className={`match-item ${activeMatch?.id === match.id ? 'active' : ''}`}
              onClick={() => selectMatch(match)}
            >
              <img 
                src={match.profile_photo || '/default-avatar.png'} 
                alt={match.username} 
              />
              <div className="match-info">
                <h4>{match.first_name} {match.last_name}</h4>
                <p>@{match.username}</p>
              </div>
              {match.last_seen && (
                <span className={`online-status ${match.is_online ? 'online' : 'offline'}`}></span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {activeMatch ? (
          <>
            <div className="chat-header">
              <img 
                src={activeMatch.profile_photo || '/default-avatar.png'} 
                alt={activeMatch.username} 
              />
              <div className="chat-header-info">
                <h3>{activeMatch.first_name} {activeMatch.last_name}</h3>
                <p>@{activeMatch.username}</p>
              </div>
            </div>
            
            <div className="chat-messages">
              {loading ? (
                <div className="loading-messages">Loading messages...</div>
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
                placeholder="Type a message..." 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button type="submit" className="send-btn" disabled={!socket}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="empty-chat">
            <h3>Select a match to start chatting</h3>
            <p>Brewing connections...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
