const pool = require('./pool');
const bcrypt = require('bcrypt');
require('dotenv').config();

// ==================== DONNÉES FACTICES ====================

const firstNames = [
  'Jean', 'Marie', 'Pierre', 'Sophie', 'Thomas', 'Julie', 'Nicolas', 'Laura',
  'David', 'Emma', 'Lucas', 'Chloé', 'Alexandre', 'Camille', 'Maxime', 'Manon',
  'Antoine', 'Sarah', 'Kevin', 'Marine', 'Julien', 'Mathilde', 'Romain', 'Léa',
  'Florent', 'Lucie', 'Vincent', 'Pauline', 'Guillaume', 'Alice', 'Baptiste', 'Jeanne',
  'Louis', 'Jeanne', 'Charles', 'Victoire', 'Henri', 'Marguerite', 'François', 'Catherine',
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah'
];

const lastNames = [
  'Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
  'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Michel', 'Garcia', 'David',
  'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'Andre', 'Lefevre',
  'Mercier', 'Dupuis', 'Lambert', 'Benoit', 'Rousseau', 'Blanc', 'Guerin', 'Molinier',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Taylor'
];

const cities = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
  { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
  { name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
  { name: 'Nice', lat: 43.7102, lng: 7.2620 },
  { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
  { name: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  { name: 'Lille', lat: 50.6292, lng: 3.0573 },
  { name: 'Rennes', lat: 48.1173, lng: -1.6778 },
  { name: 'Reims', lat: 49.2583, lng: 4.0317 },
  { name: 'Le Havre', lat: 49.4944, lng: 0.1079 },
  { name: 'Saint-Étienne', lat: 45.4397, lng: 4.3872 },
  { name: 'Toulon', lat: 43.1242, lng: 5.9280 },
  { name: 'Grenoble', lat: 45.1885, lng: 5.7245 },
  { name: 'Dijon', lat: 47.3220, lng: 5.0415 },
  { name: 'Angers', lat: 47.4784, lng: -0.5632 },
  { name: 'Nîmes', lat: 43.8367, lng: 4.3601 },
  { name: 'Villeurbanne', lat: 45.7719, lng: 4.8902 }
];

const bios = [
  'Passionné(e) de café et de nouvelles rencontres !',
  'Amoureux(se) des voyages et des découvertes.',
  'Sportif(ve) dans l\'âme, à la recherche d\'une partenaire de running.',
  'Geek et fier de l\'être. Code, café et chats.',
  'Artiste dans l\'âme, je peins mes émotions.',
  'Cuisinier(ère) amateur, je teste de nouvelles recettes chaque semaine.',
  'Plutôt bière que café, mais ouvert à tout.',
  'À la recherche de l\'âme sœur pour partager des moments simples.',
  'Vegan et écolo, je veux changer le monde.',
  'Musicien(ne), je joue de la guitare et cherche ma muse.',
  'Cinéphile, passionné(e) de films indépendants.',
  'Lecteur(trice) invétéré, toujours un livre dans mon sac.',
  'Barista en herbe, je fais le meilleur café de la ville.',
  'Yogi, je médite et cherche l\'équilibre.',
  'Entrepreneur(se), je construis mon empire.',
  'Fêtard(e), j\'adore sortir et danser.',
  'Calme et réservé(e), j\'ai besoin de temps pour m\'ouvrir.',
  'Extraverti(e) et sociable, je connais tout le monde.',
  'Fleur bleue, je crois encore au grand amour.',
  'Pragmatique, je cherche une relation sérieuse.'
];

const genders = ['male', 'female', 'other'];
const sexualPreferences = ['male', 'female', 'bisexual'];

// ==================== FONCTIONS UTILITAIRES ====================

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBirthDate() {
  const age = randomInt(18, 80);
  const year = new Date().getFullYear() - age;
  const month = randomInt(0, 11);
  const day = randomInt(1, 28);
  return new Date(year, month, day).toISOString().split('T')[0];
}

function randomDate() {
  const start = new Date(2023, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ==================== GÉNÉRATION DE PHOTOS ====================

function getRandomPhotoUrl(gender, number) {
  const genderFolder = gender === 'male' ? 'men' : (gender === 'female' ? 'women' : (randomInt(0, 1) === 0 ? 'men' : 'women'));
  return `https://randomuser.me/api/portraits/${genderFolder}/${number}.jpg`;
}

// ==================== RÉCUPÉRATION DES TAGS ====================

async function getExistingTags() {
  const result = await pool.query('SELECT id, name FROM tags');
  return result.rows;
}

// ==================== GÉNÉRATION DES UTILISATEURS ====================

async function generateUsers(count, existingTags) {
  const hashedPassword = await bcrypt.hash('Test123!', 10);
  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName = randomItem(firstNames);
    const lastName = randomItem(lastNames);
    const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${randomInt(1, 999)}`;
    const email = `${username}@matcha-test.com`;
    const gender = randomItem(genders);
    const sexualPref = randomItem(sexualPreferences);
    const bio = randomItem(bios);
    const city = randomItem(cities);
    const birthDate = randomBirthDate();
    const locationManual = Math.random() > 0.3;
    const isVerified = true;
    const popularityScore = randomInt(0, 100);
    const lastSeen = randomDate();
    const createdAt = randomDate();
    const updatedAt = new Date();

    // Insérer l'utilisateur
    const result = await pool.query(
      `INSERT INTO users 
       (username, email, password_hash, first_name, last_name, 
        gender, sexual_preferences, bio, location_city, 
        latitude, longitude, location_manual, birth_date,
        is_verified, popularity_score, last_seen, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id`,
      [
        username, email, hashedPassword, firstName, lastName,
        gender, sexualPref, bio, city.name,
        locationManual ? null : city.lat,
        locationManual ? null : city.lng,
        locationManual,
        birthDate, isVerified, popularityScore, lastSeen, createdAt, updatedAt
      ]
    );

    const userId = result.rows[0].id;
    users.push(userId);

    // Ajouter des tags aléatoires (2-5 tags)
    const numTags = randomInt(2, 5);
    const shuffledTags = [...existingTags].sort(() => 0.5 - Math.random());
    for (let j = 0; j < numTags && j < shuffledTags.length; j++) {
      await pool.query(
        'INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, shuffledTags[j].id]
      );
    }

    // Ajouter des photos (1-5 photos) avec is_external = true
    const numPhotos = randomInt(1, 5);
    for (let j = 0; j < numPhotos; j++) {
      const isProfile = j === 0;
      const randomNum = randomInt(0, 99);
      const photoUrl = getRandomPhotoUrl(gender, randomNum);
      
      await pool.query(
        `INSERT INTO photos (user_id, url, is_profile, is_external, created_at)
         VALUES ($1, $2, $3, true, NOW())`,
        [userId, photoUrl, isProfile]
      );
    }

    if ((i + 1) % 50 === 0) {
      console.log(`📦 ${i + 1}/${count} utilisateurs créés...`);
    }
  }

  return users;
}

// ==================== MAIN ====================

async function seed() {
  try {
    console.log('🌱 Suppression des données existantes...');
    
    await pool.query('TRUNCATE TABLE user_tags, photos, likes, visits, messages, notifications, blocks, users CASCADE');
    console.log('✅ Données supprimées');

    console.log('📋 Récupération des tags...');
    const existingTags = await getExistingTags();
    console.log(`✅ ${existingTags.length} tags disponibles`);

    console.log('👥 Génération des 500 utilisateurs de test...');
    const users = await generateUsers(500, existingTags);
    console.log(`✅ ${users.length} utilisateurs créés avec succès !`);

    const totalUsers = await pool.query('SELECT COUNT(*) as total FROM users');
    const usersWithPhotos = await pool.query('SELECT COUNT(DISTINCT user_id) as total FROM photos');
    const usersWithTags = await pool.query('SELECT COUNT(DISTINCT user_id) as total FROM user_tags');
    
    console.log('\n📊 Statistiques:');
    console.log(`   - Total utilisateurs: ${totalUsers.rows[0].total}`);
    console.log(`   - Utilisateurs avec photos: ${usersWithPhotos.rows[0].total}`);
    console.log(`   - Utilisateurs avec tags: ${usersWithTags.rows[0].total}`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
  } finally {
    await pool.end();
  }
}

seed();