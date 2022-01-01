/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env')) {
  console.debug('Using .env file to supply config environment variables');
  dotenv.config({ path: '.env' });
} else {
  console.debug('Using .env.production file to supply config environment variables');
  dotenv.config({ path: '.env.production' }); // DELETE THIS AFTER YOU CREATE YOUR OWN .env FILE!
}

export const ENVIRONMENT = process.env.NODE_ENV || 'development';
export const prod = ENVIRONMENT === 'production';

/**
 * PORT
 */
export const DEFAULT_PORT = 2000;
let DEV_PEER_PORT = 0;

if (process.env.GENERATE_DEV_DEV_PEER_PORT === 'true')
  DEV_PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);

export const PORT = DEV_PEER_PORT || DEFAULT_PORT;

export const JWTSECRET = process.env['JWTSECRET'];

export const NEXT_JS_APP_ADDRESS = prod
  ? process.env['NEXT_JS_APP_ADDRESS']
  : process.env['NEXT_JS_APP_ADDRESS_DEV'];

export const REDIS_URL = process.env['REDIS_URL'];
export const REDIS_PASSWORD = process.env['REDIS_PASSWORD'];
export const REDIS_PORT = Number(process.env['REDIS_PORT']);

export const REDIS_URL_CACHING = process.env['REDIS_URL_CACHING'];
export const REDIS_PASSWORD_CACHING = process.env['REDIS_PASSWORD_CACHING'];
export const REDIS_PORT_CACHING = Number(process.env['REDIS_PORT_CACHING']);

export const SESSION_SECRET = process.env['SESSION_SECRET'];
export const ADMIN_EMAIL = process.env['ADMIN_EMAIL'];
