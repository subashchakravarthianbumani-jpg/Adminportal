// Simple in-memory cache utility
const cacheMap = new Map();
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 1 day in ms (24 * 60 * 60 * 1000) - cache for 1 day

export { DEFAULT_TTL };

/**
 * Get cached value by key
 * @param {string} key
 * @returns cached value or null if not found/expired
 */
export function getCache(key) {
  const cached = cacheMap.get(key);

  if (!cached) return null;

  if (cached.expiry < Date.now()) {
    cacheMap.delete(key);

    return null;
  }

  return cached.value;
}

/**
 * Set cache value with optional TTL
 * @param {string} key
 * @param {*} value
 * @param {number} ttl milliseconds (default 5 min)
 */
export function setCache(key, value, ttl = DEFAULT_TTL) {
  cacheMap.set(key, { value, expiry: Date.now() + ttl });
}

/**
 * Optional: clear a single cache key
 */
export function clearCache(key) {
  if (key.includes('*')) {
    const prefix = key.replace('*', '');

    for (let k of cacheMap.keys()) {
      if (k.startsWith(prefix)) cacheMap.delete(k);
    }
  } else {
    cacheMap.delete(key);
  }
}

export function deleteCache(key) {
  if (cache[key]) {
    delete cache[key]
  }
}

/**
 * Optional: clear all cache
 */
export function clearAllCache() {
  cacheMap.clear();
}


export function deleteCacheByPrefix(prefix) {
  for (const key of cacheMap.keys()) {
    if (key.startsWith(prefix)) {
      cacheMap.delete(key);
    }
  }
}
