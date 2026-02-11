const redis = require('redis');
require('dotenv').config()

// 1. Create a Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

// 2. Catch any client-level errors
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// 3. An async function to connect the client
const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Connected to Redis');
  }
};

const flushRedisData = async (req, res) => {
    try {
        await redisClient.flushAll(); 
        console.log('Flushed entire Redis DB(s)');
        return res.status(200).send('All Cache Cleared');
    } catch (error) {
        console.error('Error flushing Redis:', error);
        return res.status(500).send('Failed to clear cache');
    }
};

module.exports = {
  redisClient,
  connectRedis,
  flushRedisData
};