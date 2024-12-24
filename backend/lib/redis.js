import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  tls: true, // Upstash requires TLS
  maxRetriesPerRequest: 50, // Increase retries from 20 to 50
  reconnectOnError: (err) => {
    console.error("Reconnect on error:", err.message);
    return true; // Reconnect on any error
  },
  retryStrategy: (times) => {
    console.warn(`Retrying Redis connection attempt: ${times}`);
    return Math.min(times * 50, 2000); // Exponential backoff strategy
  },
  connectTimeout: 10000, // Wait 10 seconds for connection before failing
});

// Handle Redis errors to avoid crashing the app
redis.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

redis
  .ping()
  .then((result) => {
    console.log("Redis PING response:", result); // Should log "PONG"
  })
  .catch((err) => {
    console.error("Redis connection failed:", err.message);
  });

export default redis;
