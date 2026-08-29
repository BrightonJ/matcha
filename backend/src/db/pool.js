const { Pool } = require("pg");

// Détecte si on est en mode Docker ou local
const isDocker =
  process.env.DB_HOST === "postgres" || process.env.DOCKER_ENV === "true";

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  host: process.env.DB_HOST || (isDocker ? "postgres" : "localhost"),
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "matcha",
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Erreur de connexion à PostgreSQL:", err.message);
  } else {
    release();
  }
});

module.exports = pool;
