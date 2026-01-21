// src/lib/redis.js
import { createClient } from 'redis';
import { env } from '../config/env.js';

let redisClient = null;

/**
 * Initialize Redis client
 */
export async function initRedis() {
    if (redisClient) return redisClient;

    try {
        const client = createClient({
            url: env.redisUrl || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error('Redis: Too many reconnection attempts');
                        return new Error('Too many retries');
                    }
                    return retries * 100; // Exponential backoff
                },
            },
        });

        client.on('error', (err) => console.error('Redis Client Error:', err));
        client.on('connect', () => console.log('Redis: Connected'));
        client.on('reconnecting', () => console.log('Redis: Reconnecting...'));
        client.on('ready', () => console.log('Redis: Ready'));

        await client.connect();
        redisClient = client;

        return client;
    } catch (error) {
        console.error('Redis initialization failed:', error);
        // Don't throw - allow app to run without Redis
        return null;
    }
}

/**
 * Get Redis client instance
 */
export function getRedisClient() {
    return redisClient;
}

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in seconds
 */
export function cacheMiddleware(ttl = 300) {
    return async (req, res, next) => {
        if (!redisClient) return next();

        // Only cache GET requests
        if (req.method !== 'GET') return next();

        const key = `cache:${req.originalUrl || req.url}`;

        try {
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                console.log(`Cache HIT: ${key}`);
                return res.json(JSON.parse(cachedData));
            }

            console.log(`Cache MISS: ${key}`);

            // Store original res.json
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = (data) => {
                redisClient.setEx(key, ttl, JSON.stringify(data)).catch(err => {
                    console.error('Redis cache set error:', err);
                });
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
}

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'cache:patients:*')
 */
export async function invalidateCache(pattern) {
    if (!redisClient) return;

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
        }
    } catch (error) {
        console.error('Cache invalidation error:', error);
    }
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        console.log('Redis: Connection closed');
    }
}
