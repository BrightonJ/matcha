const express = require("express");
const morgan = require("morgan");
const path = require("path");
const http = require("http");
const { initSocket } = require("./src/socket");
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

const PORT = process.env.PORT;
const app = express();

app.use(morgan("short"));
app.use(express.json());

// Servir les fichiers statiques (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

const server = http.createServer(app);

global.io = initSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket ready`);
});
