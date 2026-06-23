const { Redis } = require('@upstash/redis');

// Initialize Redis client. For local dev without credentials, it might throw if not provided
const redisUrl = process.env.UPSTASH_REDIS_URL;
const redisToken = process.env.UPSTASH_REDIS_TOKEN;

let redis = null;
if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
} else {
  console.warn('WARNING: UPSTASH_REDIS_URL or UPSTASH_REDIS_TOKEN not set. Redis is mocked.');
  // Simple mock for local development without actual Redis
  const mockStorage = new Map();
  redis = {
    get: async (key) => mockStorage.get(key) || null,
    set: async (key, value) => { mockStorage.set(key, value); return 'OK'; },
    incr: async (key) => {
      const val = (mockStorage.get(key) || 0) + 1;
      mockStorage.set(key, val);
      return val;
    },
    expire: async (key, ttl) => 1,
    del: async (key) => { mockStorage.delete(key); return 1; },
    ttl: async (key) => 100,
  };
}

module.exports = redis;
