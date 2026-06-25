const { Redis } = require('@upstash/redis');

// Fallback logic for when Redis is not available locally or credentials are not provided
const hasRedisConfig = process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN;

let redis;
if (hasRedisConfig) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });
} else {
  // Simple in-memory mock for local dev if Upstash isn't configured
  console.warn('⚠️ UPSTASH_REDIS_URL or UPSTASH_REDIS_TOKEN missing. Using in-memory mock for Redis.');
  const store = new Map();
  redis = {
    get: async (key) => store.get(key) || null,
    set: async (key, value) => { store.set(key, typeof value === 'string' ? value : JSON.stringify(value)); return 'OK'; },
    del: async (key) => { const r = store.has(key); store.delete(key); return r ? 1 : 0; },
    incr: async (key) => { const v = parseInt(store.get(key) || '0', 10) + 1; store.set(key, v.toString()); return v; },
    expire: async (key, ttl) => 1,
    ttl: async (key) => 60,
  };
}

module.exports = redis;
