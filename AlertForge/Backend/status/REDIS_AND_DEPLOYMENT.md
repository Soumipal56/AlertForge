# Redis Adapter Setup (Socket.IO Scaling) + Render Deployment Guide

This guide provides a production-grade strategy for scaling Socket.IO using Redis and deploying the AlertForge backend to Render.

---

## 1. Redis Adapter (Socket.IO Scaling)

### Why is a Redis Adapter needed?
By default, Socket.IO stores all session data and room information in **memory**. If you scale your backend to multiple server instances (or containers), a client connected to "Server A" will not be able to communicate with a client connected to "Server B".

### The Multi-Server Problem
- **Scenario**: User 1 joins a War Room on Server A. User 2 joins the same room on Server B.
- **Issue**: When User 1 sends a message, Server A only knows about the clients connected to it. User 2 will never receive the message.

### The Redis Solution (Pub/Sub)
The Redis Adapter uses the **Redis Pub/Sub** mechanism. When an event is emitted on Server A, the adapter publishes it to a Redis channel. All other server instances (Server B, C, etc.) are "subscribed" to that channel, receive the event, and broadcast it to their locally connected clients.

---

## 2. Proper Upstash Setup

To use Redis with Socket.IO, you must distinguish between the two communication protocols Upstash provides.

### ⚠️ REST vs. Redis Protocol (RESP)
- **REST URL (`https://...`)**: Used for stateless HTTP requests. Perfect for caching data but **incompatible** with the Socket.IO adapter.
- **Redis Connection String (`rediss://...`)**: The standard Redis protocol (RESP) over TCP/SSL. This is **required** for real-time Pub/Sub.

### Step-by-Step Upstash Config:
1. Create a database in your [Upstash Dashboard](https://console.upstash.com/).
2. Under the **"Details"** tab, scroll down to the **"Connect to your database"** section.
3. Select the **"Node.js"** tab and find the **"Redis Connect"** section (not REST).
4. Copy the connection string. It should look like this:
   `rediss://default:<YOUR_PASSWORD>@<YOUR_HOST>:<PORT>`

---

## 3. Socket.IO Redis Adapter Implementation

Place your adapter configuration in `src/config/redis.adapter.js` to keep the logic modular.

```javascript
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import appConfig from "./appConfig.js";

export const setupRedisAdapter = async (io) => {
    const { redisUrl } = appConfig;

    // Detect and block invalid REST URLs
    if (redisUrl && redisUrl.startsWith("https://")) {
        console.warn("[Redis] REST URL detected. Skipping adapter (needs rediss://).");
        return;
    }

    if (!redisUrl) {
        console.log("[Redis] Running in single-server mode.");
        return;
    }

    try {
        // 1. Create Pub/Sub Clients (RESP Protocol)
        const pubClient = createClient({ 
            url: redisUrl,
            socket: { tls: true } // Required for Upstash SSL
        });
        const subClient = pubClient.duplicate();

        // 2. Connect both clients
        await Promise.all([pubClient.connect(), subClient.connect()]);

        // 3. Attach Adapter to Socket.IO
        io.adapter(createAdapter(pubClient, subClient));
        
        console.log("[Redis] Adapter attached successfully. Scaling enabled.");
    } catch (error) {
        console.error("[Redis] Failed to initialize adapter:", error.message);
        console.log("[Redis] Falling back to single-server mode.");
    }
};
```

---

## 4. Error Fix Section

### "Invalid Protocol" Error
This happens when you try to pass an `https://` URL to the `redis` client. 
- **Fix**: Ensure your `REDIS_URL` starts with `rediss://`. If you only have the REST URL, you cannot use the adapter; it will default to single-server mode.

### Safe Fallback Behavior
The implementation above uses a `try/catch` block. If Redis is down or misconfigured, the backend will **not crash**. It will simply log the error and continue running as a standalone server.

### Debugging Logs
Watch your console for:
- `[Redis] REST URL detected`: You are using the wrong env var.
- `[Redis] Adapter attached`: Scaling is active and working.

---

## 5. Render Deployment Guide

### Backend Setup:
1. **Create Web Service**: Connect your GitHub repository.
2. **Runtime**: Node.
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js` (Never use `nodemon` in production; it wastes resources).
5. **Environment Variables**:
   - `PORT`: Leave blank (Render sets this automatically).
   - `NODE_ENV`: `production`
   - `MONGO_URI`: Your MongoDB Atlas string.
   - `REDIS_URL`: Your Upstash `rediss://` string.
   - `CLIENT_URL`: Your Frontend URL (for CORS).

### Common Render Issues:
- **Port Binding**: Ensure your `server.js` uses `process.env.PORT`. If you hardcode `3000`, Render will mark your service as failed because it can't find the internal port.
- **Cold Start**: Free tier services "sleep" after 15 mins of inactivity. The first request after a sleep will have a delay.
- **Websockets**: Render supports native WebSockets. No special configuration is needed other than ensuring CORS allows your frontend domain.

---

## 6. Production Best Practices

### Graceful Shutdown Handling
Always handle `SIGTERM` signals to close the server and DB connections cleanly. This prevents "zombie" socket connections.
```javascript
process.on("SIGTERM", () => {
    server.close(() => {
        mongoose.connection.close();
        process.exit(0);
    });
});
```

### CORS Configuration
In production, restrict `origin` to only your frontend domain to prevent unauthorized socket connections.
```javascript
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"]
    }
});
```

### Logging Strategy
Use a logger like `morgan` for HTTP requests and standard `console.error` for critical startup failures. Avoid excessive logging in high-traffic socket events to maintain performance.
