import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) {
  console.debug('Using .env file to supply config environment variables');
  dotenv.config({ path: '.env' });
} else {
  console.debug('Using .env.example file to supply config environment variables');
  dotenv.config({ path: '.env.example' }); // DELETE THIS AFTER YOU CREATE YOUR OWN .env FILE!
}

export const ENVIRONMENT = process.env.NODE_ENV || 'development';
const prod = ENVIRONMENT === 'production';

export const MONGODB_URI = prod ? process.env['MONGODB_URI'] : process.env['MONGODB_URI_LOCAL'];
export const DB_NAME = process.env['DB_NAME'];

/**
 * MONGODB
 */
if (!MONGODB_URI) {
  if (prod) {
    console.error('No mongo connection string. Set MONGODB_URI environment variable.');
  } else {
    console.error('No mongo connection string. Set MONGODB_URI_LOCAL environment variable.');
  }
}

/**
 * PORT
 */
export const DEFAULT_PORT = 2000;
let PEER_PORT = 0;

if (process.env.GENERATE_PEER_PORT === 'true')
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);

export const PORT = PEER_PORT || DEFAULT_PORT;

export const JWTSECRET = process.env['JWTSECRET'] as string;

export const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

export const REDIS_URL = process.env['REDIS_URL'];
export const REDIS_PASSWORD = process.env['REDIS_PASSWORD'];

export const SESSION_SECRET = process.env['SESSION_SECRET'];
export const ADMIN_EMAIL = process.env['ADMIN_EMAIL'];
