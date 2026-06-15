import { useState, useRef, useEffect } from 'react';
import mockUsers from '../mocks/users.json';
import '../assets/css/chat.css';

function Chat() {
  // On utilise nos mockUsers comme "Matchs"
  const matches = mockUsers.slice(0, 2); 
  const [activeMatch, setActiveMatch] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState({});
  const messagesEndRef = useRef(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeMatch) return;
    
    const newMessage = {
      id: Date.now(),
      from_user_id: 99, // Ton faux ID local
      content: messageText,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => ({
      ...prev,
      [activeMatch.id]: [...(prev[activeMatch.id] || []), newMessage]
    }));
    
    setMessageText('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeMatch]);

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header"><h2>Your Matches</h2></div>
        <div className="matches-list">
          {matches.map(match => (
            <div key={match.id} className={`match-item ${activeMatch?.id === match.id ? 'active' : ''}`} onClick={() => setActiveMatch(match)}>
              <img src={`https://ui-avatars.com/api/?background=8baa5e&color=fff&name=${match.username}`} alt={match.username} />
              <div className="match-info"><h4>{match.first_name}</h4></div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {activeMatch ? (
          <>
            <div className="chat-header">
              <h3>{activeMatch.first_name} {activeMatch.last_name}</h3>
            </div>
            <div className="chat-messages">
              {(messages[activeMatch.id] || []).map((msg) => (
                <div key={msg.id} className={`message-bubble ${msg.from_user_id === 99 ? 'sent' : 'received'}`}>
                  <p>{msg.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input type="text" placeholder="Type a message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} />
              <button type="submit" className="send-btn">Send</button>
            </form>
          </>
        ) : (
          <div className="empty-chat"><h3>Select a match to start chatting</h3></div>
        )}
      </div>
    </div>
  );
}

export default Chat;