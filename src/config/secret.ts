/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import dotenv from 'dotenv';
import fs from 'fs';
import { networkInterfaces } from 'os';

if (fs.existsSync('.env')) {
  console.debug('Using .env file to supply config environment variables');
  dotenv.config({ path: '.env' });
} else {
  console.debug('Using .env.production file to supply config environment variables');
  dotenv.config({ path: '.env.production' }); // DELETE THIS AFTER YOU CREATE YOUR OWN .env FILE!
}

export const ENVIRONMENT = process.env.NODE_ENV || 'development';
const prod = ENVIRONMENT === 'production';

export const MONGODB_URI = prod ? process.env['MONGODB_URI'] : process.env['MONGODB_URI_DEV'];
export const DB_NAME = process.env['DB_NAME'];

/**
 * STOP STARTING SERVER UNLESS MONGODB URI IS PROVIDED
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

export const JWTSECRET = process.env['JWTSECRET'];

// export const ROOT_NODE_ADDRESS = process.env['ROOT_NODE_ADDRESS'];
export const ROOT_NODE_ADDRESS = prod
  ? process.env['ROOT_NODE_ADDRESS']
  : process.env['ROOT_NODE_ADDRESS_DEV'];

/**
 * STOP STARTING SERVER UNLESS ROOT_NODE_ADDRESS IS PROVIDED
 */
if (!ROOT_NODE_ADDRESS) {
  if (prod) {
    throw new Error('No Redis host url. Set ROOT_NODE_ADDRESS environment variable.');
  } else {
    throw new Error('No Redis host url. Set ROOT_NODE_ADDRESS_DEV environment variable.');
  }
}

export const NEXT_JS_APP_ADDRESS = prod
  ? process.env['NEXT_JS_APP_ADDRESS']
  : process.env['NEXT_JS_APP_ADDRESS_DEV'];

export const REDIS_URL = process.env['REDIS_URL'];
export const REDIS_PASSWORD = process.env['REDIS_PASSWORD'];
export const REDIS_PORT = Number(process.env['REDIS_PORT']);

/**
 * STOP STARTING SERVER UNLESS REDIS_URL IS PROVIDED
 */
if (!REDIS_URL) {
  if (prod) {
    throw new Error('No Redis host url. Set REDIS_URL environment variable.');
  } else {
    throw new Error('No Redis host url. Set REDIS_URL_LOCAL environment variable.');
  }
}

export const REDIS_URL_CACHING = process.env['REDIS_URL_CACHING'];
export const REDIS_PASSWORD_CACHING = process.env['REDIS_PASSWORD_CACHING'];
export const REDIS_PORT_CACHING = Number(process.env['REDIS_PORT_CACHING']);

/**
 * STOP STARTING SERVER UNLESS REDIS_URL_CACHING IS PROVIDED
 */
if (!REDIS_URL_CACHING) {
  if (prod) {
    throw new Error('No Redis host url. Set REDIS_URL_CACHING environment variable.');
  } else {
    throw new Error('No Redis host url. Set REDIS_URL_CACHING_LOCAL environment variable.');
  }
}

export const SESSION_SECRET = process.env['SESSION_SECRET'];
export const ADMIN_EMAIL = process.env['ADMIN_EMAIL'];
export const KADOCOIN_VERSION = '1.0.0';

/**
 * IP ADDRESS
 */
const nets = networkInterfaces();
const results = Object.create(null);

for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // SKIP OVER NON-IPV4 AND INTERNAL (I.E. 127.0.0.1) ADDRESSES
    if (net.family === 'IPv4' && !net.internal) {
      if (!results[name]) {
        results[name] = [];
      }
      results[name].push(net.address);
    }
  }
}

const _IP = JSON.stringify(Object.values(results)[0]).substring(2, 15);
function getIP() {
  let ip = '';
  for (let i = 0; i < _IP.length; i++) {
    const ele = _IP[i];
    if (ele == '.' || typeof Number(ele) == 'number') ip += ele;
  }
  return ip;
}

export const LOCAL_IP = getIP();
console.log({ LOCAL_IP });
