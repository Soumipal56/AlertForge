# SOCKET.IO — SYSTEM FLOW

_Last updated: 2026-05-01_

---

## 1. Current Implementation

- Socket setup lives in `src/config/socket.js`
- API key auth happens in `io.use` with hashed-key DB lookup
- `join_warroom` is the canonical room entry event
- Chat messages are validated and saved through `services/chat/chat.service.js`
- Presence counts are tracked in `services/socket/presence.service.js`
- Timeline events are saved in MongoDB through `TimelineEvent.model.js`
- `incident:new`, `incident:update`, and `timeline:event` are emitted after DB writes
- CORS origin comes from `process.env.CLIENT_URL`

---

## 2. Real Flow

### Connection Flow

```
Frontend (WarRoom.jsx / WarRoomChat.jsx)
  → initializeSocket(apiKey)
  → io(SOCKET_URL, { auth: { token: apiKey } })
  → io.use auth middleware
  → hashKey(token) → findActiveApiKeyByHashedKeyDAO()
  → valid key: socket.data.apiKey set
  → invalid key: connection rejected
```

### Incident Create Flow

```
POST /api/incidents
  → API key middleware validates request header
  → incident.controller → createIncidentService → MongoDB save
  → createTimelineEventService("incident.created")
  → emitNewIncident(incident)
  → emitTimelineEvent({ type: "incident.created", incident })
  → response returns to client
```

### Incident Update Flow

```
PATCH /api/incidents/:id/status
  → API key middleware validates request header
  → incident.controller → updateIncidentStatusService → MongoDB update
  → createTimelineEventService("incident.status_changed")
  → emitIncidentUpdate(updated)
  → emitTimelineEvent({ type: "incident.status_changed", incident })
  → response returns to client
```

### War Room Chat Flow

```
Frontend (WarRoomChat.jsx)
  → socket emits "join_warroom"
  → backend resolves room from API key metadata
  → backend loads recent messages from MongoDB
  → ack returns { success, room, count, messages[] }
  → user emits "chat:message"
  → chat.service validates message
  → message is saved to MongoDB
  → io.to(room).emit("chat:message", savedMessage)
```

---

## 3. Events

| Event | Direction | Purpose |
| :--- | :--- | :--- |
| `incident:new` | Server → Client | New incident created |
| `incident:update` | Server → Client | Incident status changed |
| `timeline:event` | Server → Client | Activity feed entry |
| `room:presence` | Server → Client | Live room count |
| `join_warroom` | Client → Server | Join API-key derived war room |
| `chat:message` | Both | Send / receive chat message |
| `chat:error` | Server → Client | Legacy chat error feedback |
| `error:event` | Server → Client | Standard socket error event |

---

## 4. Backend Structure

- `src/services/chat/chat.service.js` handles validation and persistence
- `src/services/socket/presence.service.js` handles room counts
- `src/services/timeline/timeline.service.js` handles timeline persistence
- `src/services/socket/socket.service.js` handles incident emits
- `src/config/socket.js` wires auth, room join, chat, and presence

---

## 5. Notes

- `join_warroom` is the only room join flow used by the current War Room pages
- Timeline is now persisted, so refreshes no longer clear the activity feed
- Room presence is still in-memory and can be swapped for Redis later
- CORS is environment-driven through `CLIENT_URL`
