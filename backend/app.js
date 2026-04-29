const express = require('express');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importer les routes
const authRoutes = require('./src/routes/authRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const tagRoutes = require('./src/routes/tagRoutes');
const photoRoutes = require('./src/routes/photoRoutes');
const locationRoutes = require('./src/routes/locationRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const likeRoutes = require('./src/routes/likeRoutes');

const PORT = process.env.PORT;
const app = express();

app.use(morgan('short'));
app.use(express.json());

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/likes', likeRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});