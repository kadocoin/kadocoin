import { createClient } from "redis";
import { REDIS_URL, REDIS_PASSWORD } from "../util/secret";

export const redisClientPub = createClient(6379, REDIS_URL, {
  password: REDIS_PASSWORD as string,
});
export const redisClientSub = createClient(6379, REDIS_URL, {
  password: REDIS_PASSWORD as string,
});
