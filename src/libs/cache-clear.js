import redis from "../../src/app/api/apps/redis";

export async function clearDropdownCache(Type) {

  const keys = await redis.keys(`dropdown:${Type}:*`);

  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
