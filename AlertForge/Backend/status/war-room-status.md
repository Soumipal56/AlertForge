# 🏠 WAR ROOM — STATUS

_Last updated: 2026-05-01_

---

## 1. ✅ Working Features

| Feature | Where |
| :--- | :--- |
| Fetch all incidents on load | `WarRoom.jsx` → `GET /api/incidents` with `x-api-key` |
| Create incident via form | `WarRoom.jsx` → `POST /api/incidents` with `x-api-key` |
| Quick resolve button | `WarRoom.jsx` → `PATCH /api/incidents/:id/status` |
| Live `incident:new` → prepend to list | `WarRoom.jsx` `handleNewIncident` + `upsertIncident` |
| Live `incident:update` → update card in-place | `WarRoom.jsx` `handleIncidentUpdate` + `upsertIncident` |
| Timeline event log (in-memory) | `WarRoom.jsx` `handleTimelineEvent` |
| Socket auth via API key handshake | `services/socket.js` → `auth: { token: apiKey }` |
| Socket reinitialization on key change | `WarRoom.jsx` → `reinitializeSocket()` |
| Auto `join_room` on service name input | `WarRoom.jsx` `handleServiceChange` |
| Responder count display | `WarRoom.jsx` → `room:presence` listener |
| Socket status indicator (connected / disconnected) | `WarRoom.jsx` `socketStatus` state |
| War room chat (separate page) | `WarRoomChat.jsx` → full send/receive + history on join |
| Chat persisted to MongoDB | `warRoomChat.service.js` → `WarRoomMessage` model |
| Chat history on join | `join_warroom` ack returns last 50 messages |

---

## 2. ⚠️ Partial

| Feature | Issue |
| :--- | :--- |
| Timeline | Local state only — lost on page refresh, not stored in DB |
| War room chat in `WarRoom.jsx` | Not connected — `WarRoom.jsx` uses `join_room`, not `join_warroom`; chat system only works in `WarRoomChat.jsx` |
| Incident re-fetch scope | `GET /api/incidents` returns ALL incidents — not filtered by service or room |

---

## 3. ❌ Not Working / Missing

| Feature |
| :--- |
| Chat panel inside `WarRoom.jsx` dashboard |
| Shared socket instance between `WarRoom.jsx` and `WarRoomChat.jsx` |
| Persistent timeline (DB-backed) |
| Filter incidents by severity / service |
| Responder assignment ("I'm on it") |
| SLA / time-to-resolve timer |
| Pagination / infinite scroll for incidents |
| Incident detail drill-down page |
| Redis adapter (multi-server socket routing) |
| CORS origin from env (currently hardcoded to `localhost:5173`) |

---

## 4. 🔄 War Room Flow

```
User enters API key
  → initializeSocket(apiKey) sends it in handshake auth
  → Backend io.use: hashKey(token) → DB lookup → socket.data.apiKey set

User types service name in form
  → handleServiceChange → setActiveRoom(service.toLowerCase())
  → socket.emit("join_room", service)     ← WarRoom.jsx path
  OR
  → socket.emit("join_warroom")           ← WarRoomChat.jsx path
      → Backend resolves room = apiKey.serviceName || name || id
      → returns last 50 messages in ack

Events flow
  POST /api/incidents
    → controller saves to DB
    → emitNewIncident → io.to(service room) → "incident:new"
    → emitTimelineEvent → "timeline:event"
    → WarRoom.jsx upserts incident + appends timeline item

  PATCH /api/incidents/:id/status
    → controller updates DB
    → emitIncidentUpdate → "incident:update"
    → emitTimelineEvent → "timeline:event"
    → WarRoom.jsx updates existing card

  User sends chat message (WarRoomChat.jsx only)
    → socket.emit("chat:message", { content })
    → Backend saves to MongoDB
    → io.to(room).emit("chat:message", savedMessage)
    → all room members receive it live
```

---

## 5. 🧠 Issues Found

- **Split socket usage**: `WarRoom.jsx` uses `join_room` (generic). `WarRoomChat.jsx` uses `join_warroom` (war room–scoped). These two are disconnected — a user on the main dashboard won't receive chat messages.
- **No localStorage**: Old docs said API key is saved to localStorage. **This is incorrect** — current `WarRoom.jsx` keeps apiKey in plain React state only. It resets on refresh.
- **Timeline not persisted**: Timeline items are built from live socket events. Refreshing the page clears the entire timeline.
- **No filtering on incident list**: `GET /api/incidents` returns all incidents regardless of service. UI shows everything, even incidents from other services.
- **CORS hardcoded**: `config/socket.js` has `origin: "http://localhost:5173"` — will break in production or on any other port.
- **`services/chat/` is empty**: directory exists but has no files — dead folder.

---

## 6. 🛠️ Fix Plan

- Step 1 → Add a shared socket context (React Context or Zustand) so `WarRoom.jsx` and `WarRoomChat.jsx` share one socket instance
- Step 2 → Switch `WarRoom.jsx` to call `join_warroom` instead of `join_room` to align with the chat system
- Step 3 → Persist timeline events to a `TimelineEvent` MongoDB collection; load on page open
- Step 4 → Add service-filter query param to `GET /api/incidents` so each war room only sees its own incidents
- Step 5 → Move CORS origin to `CORS_ORIGIN` env variable
- Step 6 → Implement `join_warroom` equivalent in `WarRoom.jsx` or merge chat panel into the main dashboard
