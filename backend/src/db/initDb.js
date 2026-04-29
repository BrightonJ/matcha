const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

// Configuration pour se connecter à PostgreSQL
const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: "postgres",
};

const initDatabase = async () => {
  let client;

  try {
    // Connexion à postgres
    console.log("Connexion à PostgreSQL ...");
    client = new Client(config);
    await client.connect();

    // Supprimer et recréer la base matcha
    await client.query("DROP DATABASE IF EXISTS matcha;");
    console.log("Création de la base matcha...");
    await client.query("CREATE DATABASE matcha;");

    // Fermer la connexion à postgres
    await client.end();

    // Reconnecter à la base matcha
    config.database = "matcha";
    client = new Client(config);
    await client.connect();
    console.log("Connexion à la base matcha ...");

    // Lire et exécuter les fichiers SQL
    const files = [
      "schema/users.sql",
      "schema/tags.sql",
      "schema/user_tags.sql",
      "schema/photos.sql",
      "schema/blocks.sql",
      "seeds/tags_seed.sql",
    ];

    for (const file of files) {
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, "utf8");
      await client.query(sql);
    }

    console.log("Base de données initialisée");

    // Supprimer uploads
    const uploadsDir = path.join(__dirname, "../../", "uploads");
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
      console.log("Dossier uploads supprimé");
    }
  } catch (error) {
    console.error("Erreur: ", error);
  } finally {
    if (client) await client.end();
  }
};

initDatabase();
