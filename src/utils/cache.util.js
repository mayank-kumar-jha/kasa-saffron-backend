const cache = new Map();

/**
 * Retrieves an item from the cache.
 * @param {string} key 
 * @returns {any} The cached value, or null if expired/not found
 */
export const getCache = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.value;
};

/**
 * Sets an item in the cache.
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSec Time to live in seconds (default 5 minutes)
 */
export const setCache = (key, value, ttlSec = 300) => {
  cache.set(key, {
    value,
    expiry: Date.now() + ttlSec * 1000
  });
};

/**
 * Clears all cache keys that start with the given prefix.
 * Useful for invalidating related groups of endpoints (e.g. 'products_')
 * @param {string} prefix 
 */
export const clearCachePrefix = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};
