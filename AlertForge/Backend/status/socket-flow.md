# 🔌 SOCKET.IO — SYSTEM FLOW

_Last updated: 2026-05-01_

---

## 1. ✅ Current Implementation

- socket setup (`initSocket` / `getIo`) → ✅ live in `src/config/socket.js`
- auth middleware (`io.use`) → ✅ hashes token, validates against DB
- `join_room` / `leave_room` events → ✅ with presence tracking
- `join_warroom` (dedicated war room join) → ✅ resolves room from API key, loads history
- `chat:message` (real-time chat) → ✅ saved to MongoDB, broadcast to room
- `room:presence` broadcast → ✅ on join, leave, disconnect
- `incident:new` emit → ✅ fired from `incident.controller` after DB save
- `incident:update` emit → ✅ fired from `incident.controller` after status change
- `timeline:event` emit → ✅ fired for `incident.created` and `incident.status_changed`
- room-scoped emit (by service name) → ✅ falls back to global if no service
- Redis adapter (multi-server) → ❌ not implemented
- Persistent presence (DB-backed) → ❌ in-memory only

---

## 2. 🔄 Actual Flow (REAL CODE FLOW)

### Connection Flow

```
Frontend (WarRoom.jsx / WarRoomChat.jsx)
  → initializeSocket(apiKey)           [services/socket.js]
  → io(SOCKET_URL, { auth: { token: apiKey } })
  → Backend io.use middleware          [config/socket.js]
  → hashKey(token) → findActiveApiKeyByHashedKeyDAO()
  → if valid: socket.data.apiKey set, next() called
  → if invalid: connect_error fired on client
```

### Create Incident Flow

```
POST /api/incidents (x-api-key header)
  → apiKey.middleware validates key via DB
  → incident.controller → createIncidentService → MongoDB save
  → emitNewIncident(incident)          [socket.service.js]
      → io.to(service.lowercase) OR io (global fallback)
      → emits "incident:new" payload
  → emitTimelineEvent({ type: "incident.created", incident })
      → emits "timeline:event"
  → 201 response to caller
```

### Update Incident Flow

```
PATCH /api/incidents/:id/status (x-api-key header)
  → apiKey.middleware validates key via DB
  → incident.controller → updateIncidentStatusService → MongoDB update
  → emitIncidentUpdate(updated)        [socket.service.js]
      → emits "incident:update" to service room / global
  → emitTimelineEvent({ type: "incident.status_changed", incident })
      → emits "timeline:event"
  → 200 response to caller
```

### War Room Chat Flow

```
Frontend (WarRoomChat.jsx)
  → reinitializeSocket(apiKey)
  → on connect: emit "join_warroom" (no payload needed)
  → Backend resolves room = apiKey.serviceName || apiKey.name || apiKey.id
  → loads last 50 messages from MongoDB (WarRoomMessage collection)
  → ack returns { success, room, count, messages[] }
  → user types: emit "chat:message", { content }
  → Backend saves to MongoDB via saveWarRoomMessage()
  → io.to(room).emit("chat:message", savedMessage)
  → all clients in room receive live update
```

---

## 3. 📡 Events

| Event | Direction | Where emitted | Used for |
| :--- | :--- | :--- | :--- |
| `incident:new` | Server → Client | `socket.service.js` | New incident created |
| `incident:update` | Server → Client | `socket.service.js` | Incident status changed |
| `timeline:event` | Server → Client | `socket.service.js` | Activity feed entry |
| `room:presence` | Server → Client | `config/socket.js` | Responder count update |
| `join_room` | Client → Server | `config/socket.js` | Join a named room (generic) |
| `leave_room` | Client → Server | `config/socket.js` | Leave a named room |
| `join_warroom` | Client → Server | `config/socket.js` | Join service-scoped war room + load history |
| `chat:message` | Both | `config/socket.js` | Send / receive a chat message |
| `chat:error` | Server → Client | `config/socket.js` | Chat error feedback |

---

## 4. 🔌 Frontend ↔ Backend Connection

- **Socket auth**: `initializeSocket(apiKey)` passes `auth: { token: apiKey }` in the handshake. Backend hashes it and checks MongoDB.
- **API key (REST)**: sent as `x-api-key` header via `api.js` → `withApiKey()` helper. Same key, same validation path.
- **Room join (WarRoom.jsx)**: when user types a service name → `handleServiceChange` → `socket.emit("join_room", service.toLowerCase())`. Room name = service name lowercased.
- **Room join (WarRoomChat.jsx)**: on connect → `socket.emit("join_warroom")`. Backend resolves room from API key metadata automatically.
- **UI updates**: `incident:new` → `upsertIncident()` prepends to list. `incident:update` → same upsert updates existing card. `timeline:event` → prepends to timeline log. `room:presence` → updates responder count badge.

---

## 5. ❌ Missing / Fix Needed

- `WarRoom.jsx` uses `join_room` (generic). It does NOT call `join_warroom`, so it never loads chat history and is not connected to the war room chat system.
- `WarRoom.jsx` and `WarRoomChat.jsx` are separate pages — there is no shared socket instance between them.
- `WarRoom.jsx` API key state is plain React state (typed in form). The old doc said "saved to localStorage" — **this is wrong**, no localStorage is used in current code.
- Timeline in `WarRoom.jsx` is local in-memory state only — not persisted to DB, lost on refresh.
- CORS origin is hardcoded to `http://localhost:5173` in `config/socket.js`.
- Presence map is in-memory — resets on server restart.
- `chat` service directory (`src/services/chat/`) exists but is **empty**.
- No notification REST endpoint — `sendIncidentNotification` is fire-and-forget, no retry.

---

## 6. 🛠️ Next Steps (SHORT)

- Step 1 → Connect `WarRoom.jsx` to use `join_warroom` so it shares the chat room system
- Step 2 → Merge `WarRoomChat.jsx` into `WarRoom.jsx` or use a shared socket context
- Step 3 → Move CORS origin to env variable
- Step 4 → Add Redis adapter before any horizontal scaling
- Step 5 → Persist timeline entries in DB (new `TimelineEvent` model)
