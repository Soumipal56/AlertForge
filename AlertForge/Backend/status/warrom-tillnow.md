Edited package.json
Edited package.json
Viewed test-socket.js:56-61

## Complete Summary — What Was Done This Session

### 1. `.env` — Fixed Redis Configuration
- **Removed** duplicate `REDIS_URL` entries (old `exciting-tetra` database)
- **Fixed** protocol: `redis://` → `rediss://` (TLS, required by Upstash)
- **Removed** quotes from `UPSTASH_REDIS_REST_URL` and token (were breaking URL parsing)
- **Added** `"start": "node server.js"` to `package.json` for Render deployment (you later removed it)
- **Fixed** CORS in `app.js`: hardcoded `localhost` → `process.env.CLIENT_URL`

---

### 2. `presence.service.js` — Completely Rewritten
**Before:** Used JavaScript in-memory `Map` — broken in multi-server setups (each server had its own isolated count).

**After:** Uses **Redis SETs** — distributed and accurate across all server instances.

| Redis Key | Stores | Used For |
|-----------|--------|----------|
| `presence:room:<room>` | Set of socketIds | Live online count |
| `presence:socket:<id>` | Set of rooms | Disconnect cleanup |

Falls back to in-memory `Map` automatically if Redis is unavailable.

---

### 3. `socket.js` — 4 Lines Updated
Since presence functions are now async, added `await` to all callers:
- `await addUser(room, socket.id)` — in `join_warroom`
- `await addUser(room, socket.id)` — in `join_incident_room`
- `await getRoomsForSocket()` + `await removeUser()` — in `disconnect`
- Changed `disconnect` handler from `() =>` to `async () =>`

---

### 4. `scratch/test-socket.js` — Created
A test script to verify Redis presence is working by connecting as a Socket.IO client, joining a war room, and showing what keys appear in Upstash Data Browser.

---

### Current Redis Status ✅
```
[Redis Shared] Connected successfully.
[Redis] Adapter attached successfully. Multi-server scaling enabled.
```

### Remaining Redis Gap
- `chat.service.js` — `getRecentMessages` still hits MongoDB on every room join (no Redis cache layer yet)

github -> pushed to warroom-map
