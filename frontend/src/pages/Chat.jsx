import { useState } from 'react';
import mockUsers from '../mocks/users.json';
import '../assets/css/chat.css';

function Chat() {
  const [activeMatch, setActiveMatch] = useState(null);
  const [messageText, setMessageText] = useState('');
  
  const [messages, setMessages] = useState({
    1: [
      { id: 1, sender: 'them', text: 'Hey! Love your coffee pics ☕' },
      { id: 2, sender: 'me', text: 'Thanks Julien! Are you a barista too?' }
    ]
  });

  const matches = [mockUsers[0], mockUsers[3]];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeMatch) return;

    const newMessage = {
      id: Date.now(),
      sender: 'me',
      text: messageText
    };

    setMessages(prev => ({
      ...prev,
      [activeMatch.id]: [...(prev[activeMatch.id] || []), newMessage]
    }));
    
    setMessageText('');
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Your Matches</h2>
        </div>
        <div className="matches-list">
          {matches.map(match => (
            <div 
              key={match.id} 
              className={`match-item ${activeMatch?.id === match.id ? 'active' : ''}`}
              onClick={() => setActiveMatch(match)}
            >
              <img src={match.profilePic} alt={match.username} />
              <div className="match-info">
                <h4>{match.username}</h4>
                <p>Click to chat</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {activeMatch ? (
          <>
            <div className="chat-header">
              <img src={activeMatch.profilePic} alt={activeMatch.username} />
              <h3>{activeMatch.username}</h3>
            </div>
            
            <div className="chat-messages">
              {(messages[activeMatch.id] || []).map(msg => (
                <div key={msg.id} className={`message-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                  {msg.text}
                </div>
              ))}
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Type a message..." 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button type="submit" className="send-btn">Send</button>
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