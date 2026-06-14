import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Konfigurasi koneksi langsung ke MySQL XAMPP
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Kosong secara default di XAMPP
  database: 'wil_coffeeshopdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;