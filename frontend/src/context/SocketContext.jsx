import { createContext, useContext, useState, useEffect } from 'react';

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // On crée un faux objet socket qui ne fait rien mais empêche les crashs
    const dummySocket = {
      on: (event, callback) => console.log(`Socket simulé écoute: ${event}`),
      off: (event) => console.log(`Socket simulé arrête d'écouter: ${event}`),
      emit: (event, data, callback) => {
        console.log(`Socket simulé émet: ${event}`, data);
        if (callback) callback({ success: true, message: { content: data.content || 'Message simulé', created_at: new Date() }});
      },
      disconnect: () => console.log('Socket simulé déconnecté'),
      userId: 99
    };
    
    setSocket(dummySocket);
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};