# AlertForge Rate Limiting System

## 1. Overview
Rate limiting is a critical infrastructure component of the **AlertForge Incident Response Platform**. It ensures system stability, prevents abuse, and protects resources by regulating the frequency of requests and events across the distributed backend. In a high-stakes environment like incident management, ensuring that the system remains responsive during peak load or malicious activity is paramount.

## 2. Role of Rate Limiting in AlertForge
In AlertForge, rate limiting serves several vital roles:
*   **Incident Integrity**: Prevents automated scripts from flooding the system with fake incidents or status changes.
*   **War Room Stability**: Protects real-time communication channels from message spam and "typing" event flooding, ensuring responders can communicate clearly.
*   **Resource Protection**: Guards heavy operations (like file uploads and report generation) from overwhelming the cloud storage and compute budget.
*   **Fair Usage**: In a distributed environment, it ensures that one rogue API key or IP address cannot degrade performance for other authorized responders.

## 3. Architecture of the Rate Limiting System
The system is built on a **multi-layered, distributed architecture** using Redis as the central source of truth for request counts.

### Express REST API Layer
Uses `express-rate-limit` integrated with a shared Redis store to enforce limits on HTTP traffic. This layer handles identity verification via IP addresses or Hashed API Keys.

### Socket.IO Real-Time Layer
A custom throttling engine that intercepts WebSocket events. Unlike standard HTTP middleware, this layer tracks event-level frequency (e.g., how many messages per second a specific socket sends).

### Distributed Flow
```text
[ Client ]
    |
    v
[ Load Balancer ]
    |
    +-----> [ Instance A ] ----> [ Redis (Shared Counters) ]
    |                               ^
    +-----> [ Instance B ] ---------+
```

#### Request Flow:
1.  **REST**: Request -> `express-rate-limit` -> Redis `INCR` -> Check Limit -> Allow/Block -> Controller.
2.  **Socket**: Event -> `throttleSocketEvent` -> Redis `MULTI/EXEC` -> Emit/Drop.

## 4. Implementation Details

### API Rate Limiting (REST)
*   **Library**: `express-rate-limit` (v7) + `rate-limit-redis`.
*   **Identification**: 
    *   **Public**: IP-based identification for baseline protection.
    *   **Authenticated**: API-Key-based identification for responders.
*   **Strategy**: Distributed Sliding Window (approximate via Redis Store).

### Socket.IO Rate Limiting
*   **Message Throttling**: Limits users to 3 messages per second to prevent chat flooding.
*   **Typing Debounce**: Restricts typing indicators to once every 2 seconds per user.
*   **Connection Guard**: Limits reconnection attempts per IP to prevent rapid handshake spam.

### Redis Key Strategy
Keys are designed for clarity and global uniqueness:
*   `rl:api:public:{ip}`: IP-level HTTP tracking.
*   `rl:api:auth:{apiKeyId}`: Key-level HTTP tracking.
*   `rl:socket:{event}:{socketId|apiKeyId}`: Real-time event tracking.
*   **TTL**: All keys are automatically expired by Redis once the window closes, ensuring no memory leaks.

## 5. Key Features Implemented
*   **IPv6-Safe Logic**: Configured for modern networking environments without validation overhead.
*   **Hybrid Identification**: Seamlessly switches between IP and API Key based on the request context.
*   **Production-Grade Middleware**: Fully separated from business logic, making it "plug-and-play" for new routes.
*   **Fail-Open Resilience**: If Redis becomes unreachable, the system fails open to prioritize service availability over strict limiting.

## 6. Security Benefits
*   **Anti-Spam**: Effectively kills automated bot traffic and chat noise.
*   **Brute Force Mitigation**: Protects API key generation and validation endpoints.
*   **DDoS Resistance**: Provides a robust first line of defense against distributed application-layer attacks.
*   **Integrity**: Ensures that incident timelines are not corrupted by machine-speed data injection.

## 7. Performance & Scalability
*   **Horizontal Scaling**: Since all counters reside in Redis, limits are enforced consistently whether you have 1 or 100 backend instances.
*   **Stateless Design**: Individual server instances do not maintain local state, allowing them to be replaced or rebooted without resetting user rate limits.
*   **Optimized Commands**: Uses Redis `multi` for atomic operations to minimize round-trips.

## 8. Limitations
*   **Redis Dependency**: High-precision limiting depends on Redis availability. (Mitigated by fail-open logic).
*   **Network Latency**: Every limit check adds a small round-trip delay to Redis (typically <2ms).

## 9. Future Improvements
*   **Adaptive Limiting**: Dynamically lower thresholds during periods of high CPU/Memory stress.
*   **AI Abuse Detection**: Integration with anomaly detection services to identify "low and slow" attackers.
*   **Auto-Ban System**: Automatically move repeated offenders to a "deny-list" at the firewall/LB level.
*   **Monitoring Dashboard**: Real-time visualization of rate-limit hits per API Key/Service.
