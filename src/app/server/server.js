import pool from './db.js';

const testConnection = async () => {
  try {
    const [result] = await pool.query('SELECT 1 + 1 AS solution');

    console.log('Database connection successful. Result:', result[0].solution);
  } catch (error) {
    console.log('Database connection error:', error);
  }
};

testConnection();
