import mysql from 'mysql2/promise';

// On crée un "pool" de connexions.
// Un pool = plusieurs connexions réutilisables en parallèle.
// C'est plus efficace que d'ouvrir/fermer une connexion à chaque requête.
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'proxima',
  password: process.env.DB_PASSWORD || 'proximapassword',
  database: process.env.DB_NAME     || 'proxima_infra',
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
