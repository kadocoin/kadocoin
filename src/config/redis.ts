/*
 * # Kadocoin License
 *
 * Copyright (c) 2021 Adamu Muhammad Dankore
 * Distributed under the MIT software license, see the accompanying
 * file LICENSE or <http://www.opensource.org/licenses/mit-license.php>
 */
import { createClient } from 'redis';
import { REDIS_URL, REDIS_PASSWORD, REDIS_PORT } from './secret';

export const redisClientPub = createClient(REDIS_PORT, REDIS_URL, {
  password: REDIS_PASSWORD as string,
});
export const redisClientSub = createClient(REDIS_PORT, REDIS_URL, {
  password: REDIS_PASSWORD as string,
});
