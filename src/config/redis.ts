/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import Redis from 'ioredis';
import {
  REDIS_URL,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_PORT_CACHING,
  REDIS_URL_CACHING,
} from './secret';

export const redisClientPub = new Redis({
  port: REDIS_PORT,
  host: REDIS_URL,
  password: REDIS_PASSWORD,
});
export const redisClientSub = new Redis({
  port: REDIS_PORT,
  host: REDIS_URL,
  password: REDIS_PASSWORD,
});
export const redisClientCaching = new Redis({
  port: REDIS_PORT_CACHING,
  host: REDIS_URL_CACHING,
});
