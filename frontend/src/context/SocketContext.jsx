import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import API_URL from '../config/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Ne créer la socket que si on a un utilisateur connecté
    if (!token || !user) {
      if (socket) {
        console.log('🔌 Déconnexion socket (pas d\'utilisateur)');
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log('🔌 Création de la socket pour utilisateur:', user.id);

    const newSocket = io(API_URL.replace('/api', ''), {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connectée pour utilisateur:', user.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket déconnectée:', reason);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Erreur de connexion socket:', err.message);
      if (err.message === 'Authentication error') {
        newSocket.disconnect();
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });

    setSocket(newSocket);
    
    // Exposer la socket globalement pour le logout
    window.socket = newSocket;

    return () => {
      console.log('🔌 Nettoyage socket');
      newSocket.disconnect();
      if (window.socket === newSocket) {
        window.socket = null;
      }
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
