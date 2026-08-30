const { Server } = require('socket.io');
const { message, notification, user, like } = require('../models');

let io;
const userSockets = {};

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: '*', credentials: true },
    pingTimeout: 60000,
    pingInterval: 25000
  });
  
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', async (socket) => {
    if (!userSockets[socket.userId]) {
      userSockets[socket.userId] = new Set();
    }
    userSockets[socket.userId].add(socket.id);

    if (userSockets[socket.userId].size === 1) {
      await user.updateOnlineStatus(socket.userId, true);
      io.emit('user_status', { userId: socket.userId, isOnline: true });
    }
    
    socket.join(`user:${socket.userId}`);
    
    socket.on('send_message', async (data, callback) => {
      try {
        const { toUserId, content } = data;
        
        if (!content || content.trim().length === 0) {
          if (callback) callback({ error: 'Le message ne peut pas être vide' });
          return;
        }

        const isMatch = await like.isMatch(socket.userId, toUserId);
        if (!isMatch) {
          if (callback) callback({ error: 'Vous devez être matché pour envoyer un message' });
          return;
        }
        
        const newMessage = await message.send(socket.userId, toUserId, content);
        io.to(`user:${toUserId}`).emit('new_message', newMessage);
        
        const fromUser = await user.findById(socket.userId);
        const notif = await notification.create(
          toUserId, 'message', socket.userId,
          `${fromUser.first_name} ${fromUser.last_name} vous a envoyé un message`,
          { messageId: newMessage.id }
        );
        io.to(`user:${toUserId}`).emit('notification', notif);
        
        if (callback) callback({ success: true, message: newMessage });
      } catch (error) {
        if (callback) callback({ error: error.message });
      }
    });
    
    socket.on('mark_read', async (data, callback) => {
      try {
        await message.markAsRead(socket.userId, data.fromUserId);
        if (callback) callback({ success: true });
      } catch (error) {
        if (callback) callback({ error: error.message });
      }
    });
    
    socket.on('disconnect', async () => {
      if (userSockets[socket.userId]) {
        userSockets[socket.userId].delete(socket.id);
        if (userSockets[socket.userId].size === 0) {
          delete userSockets[socket.userId];
          await user.updateOnlineStatus(socket.userId, false);
          io.emit('user_status', { userId: socket.userId, isOnline: false });
        }
      }
    });
  });
  
  return io;
}

function getIo() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { initSocket, getIo };