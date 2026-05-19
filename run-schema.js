const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const runSchema = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    
    console.log('Reading schema.sql...');
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    console.log('Executing database schema and inserting dummy data...');
    await client.query(sql);
    
    console.log('Success: Database schema and dummy data imported successfully!');
  } catch (err) {
    console.error('Error importing schema:', err.message);
  } finally {
    await client.end();
  }
};

runSchema();
