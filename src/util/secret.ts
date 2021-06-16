import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) {
  console.debug('Using .env file to supply config environment variables');
  dotenv.config({ path: '.env' });
} else {
  console.debug('Using .env.example file to supply config environment variables');
  dotenv.config({ path: '.env.example' }); // you can delete this after you create your own .env file!
}
export const ENVIRONMENT = process.env.NODE_ENV || 'development';
const prod = ENVIRONMENT === 'production'; // Anything else is treated as 'dev'
export const MONGODB_URI = prod ? process.env['MONGODB_URI'] : process.env['MONGODB_URI_LOCAL'];

/**
 * PORT
 */
const DEFAULT_PORT = 2000;
let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);

export const PORT = PEER_PORT || DEFAULT_PORT;

export const JWTSECRET = process.env['JWTSECRET'] as string

/**
 * MONGODB
 */
// if (!MONGODB_URI) {
//   if (prod) {
//     console.error('No mongo connection string. Set MONGODB_URI environment variable.');
//   } else {
//     console.error('No mongo connection string. Set MONGODB_URI_LOCAL environment variable.');
//   }
// }
