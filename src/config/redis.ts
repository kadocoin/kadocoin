import { createClient } from "redis";
export const redisClientPub = createClient(
  6379,
  "redis-kado-kobo.server01.dankore.com",
  { password: process.env.REDIS_PASSWORD as string }
);
export const redisClientSub = createClient(
  6379,
  "redis-kado-kobo.server01.dankore.com",
  { password: process.env.REDIS_PASSWORD as string }
);
