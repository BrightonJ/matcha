const express = require("express");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const { initSocket } = require("./src/socket");
const cors = require('cors');
require("dotenv").config();

// Importer les routes
const authRoutes = require("./src/routes/authRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const tagRoutes = require("./src/routes/tagRoutes");
const photoRoutes = require("./src/routes/photoRoutes");
const locationRoutes = require("./src/routes/locationRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const likeRoutes = require("./src/routes/likeRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const blockRoutes = require('./src/routes/blockRoutes');

const PORT = process.env.PORT;
const app = express();

app.use(morgan("short"));
app.use(express.json());

// Configurer CORS pour autoriser les requêtes du frontend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Configurer CORS pour autoriser localhost ET 127.0.0.1
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Permettre les requêtes sans origin (curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origin bloqué par CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/blocks", blockRoutes);

const server = http.createServer(app);

global.io = initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket ready`);
});
