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
    client = new Client(config);
    await client.connect();

    await client.query("DROP DATABASE IF EXISTS matcha;");
    await client.query("CREATE DATABASE matcha;");

    await client.end();

    config.database = "matcha";
    client = new Client(config);
    await client.connect();

    const files = [
      "schema/users.sql",
      "schema/tags.sql",
      "schema/user_tags.sql",
      "schema/photos.sql",
      "schema/blocks.sql",
      'schema/likes.sql',
      'schema/visits.sql',
      'schema/messages.sql',
      'schema/notifications.sql',
      'schema/reports.sql',
      "seeds/tags_seed.sql",
    ];

    for (const file of files) {
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, "utf8");
      await client.query(sql);
    }

    // Supprimer uploads
    const uploadsDir = path.join(__dirname, "../../", "uploads");
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error("Erreur: ", error);
  } finally {
    if (client) await client.end();
  }
};

initDatabase();
