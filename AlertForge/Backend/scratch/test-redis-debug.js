import { createClient } from "redis";

const redisUrl = "rediss://default:gQAAAAAAAbz9AAIgcDJiNmIwMDFhNTNkZjM0YmY0ODQ0YzJkMjM0YmU4NmIzYQ@alert-ghoul-113917.upstash.io:6379";

const testRedis = async () => {
    console.log("Testing Redis connection to:", redisUrl);
    const client = createClient({
        url: redisUrl,
        socket: {
            tls: true,
            rejectUnauthorized: false,
            connectTimeoutMs: 15000
        }
    });

    client.on("error", (err) => console.error("Redis Error:", err));

    try {
        await client.connect();
        console.log("Connected successfully!");
        const ping = await client.ping();
        console.log("Ping response:", ping);
        await client.disconnect();
    } catch (err) {
        console.error("Connection failed:", err.message);
    }
};

testRedis();
