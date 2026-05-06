const { Server } = require('socket.io');
const { message } = require('../models');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true
    }
  });
  
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log(`🔌 Utilisateur connecté: ${socket.userId}`);
    
    // Rejoindre sa propre room pour les notifications privées
    socket.join(`user:${socket.userId}`);
    
    // Envoyer un message
    socket.on('send_message', async (data, callback) => {
      try {
        const { toUserId, content } = data;
        
        if (!content || content.trim().length === 0) {
          callback({ error: 'Le message ne peut pas être vide' });
          return;
        }
        
        const newMessage = await message.send(socket.userId, toUserId, content);
        
        // Envoyer au destinataire en temps réel
        io.to(`user:${toUserId}`).emit('new_message', newMessage);
        
        // Confirmation à l'envoyeur
        callback({ success: true, message: newMessage });
      } catch (error) {
        callback({ error: error.message });
      }
    });
    
    // Marquer comme lu
    socket.on('mark_read', async (data, callback) => {
      try {
        const { fromUserId } = data;
        await message.markAsRead(socket.userId, fromUserId);
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });
    
    socket.on('disconnect', () => {
      console.log(`🔌 Utilisateur déconnecté: ${socket.userId}`);
    });
  });
  
  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = { initSocket, getIo };
