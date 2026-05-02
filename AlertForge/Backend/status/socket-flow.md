# 🔌 SOCKET.IO — SYSTEM FLOW

_Last updated: 2026-05-02_

---

## 1. Connection & Authentication
1. Client connects with `auth: { token: API_KEY }`.
2. `io.use` middleware hashes key and validates against MongoDB.
3. Successful auth attaches `socket.data.apiKey` and `socket.data.user` (with auto-generated name if missing).

## 2. Room Lifecycle

### A. General War Room
- Client emits `join_warroom`.
- Server resolves room name from API key service metadata.
- Server loads last 50 messages.
- Client receives `ack` with history and current presence count.

### B. Incident War Room
- Client emits `join_incident_room` with `incidentId`.
- Server verifies the incident belongs to the socket's API key.
- Server subscribes socket to `incident:{id}`.
- Server broadcasts `incident:resolved` if status changes to read-only.

## 3. Message Flow (Text + Media)

### Step 1: Upload (REST)
- Frontend POSTs file to `/api/upload`.
- Backend processes via Multer + ImageKit.
- Returns `fileUrl` and `fileType`.

### Step 2: Persistence (Socket)
- Frontend emits `chat:message` with `{ content, fileUrl, fileType }`.
- Backend validates: Must have `content` OR `fileUrl`.
- Backend `saveWarRoomMessage` persists to MongoDB.
- Backend broadcasts normalized payload to the room.

## 4. Event Schema

| Event | Logic | Payload |
| :--- | :--- | :--- |
| `incident:new` | After POST `/api/incidents` | Full incident object |
| `incident:update`| After status patch | Updated status + incidentId |
| `chat:message` | After DB save | `{ id, content, fileUrl, fileType, sender, createdAt }` |
| `room:presence` | On join/leave | `{ room, count }` |
| `error:event` | On runtime failure | `{ type, message }` |

## 5. Security Constraints
- **Authorization**: All room joins are validated against API key ownership.
- **Read-Only**: Messages are blocked server-side if `incident.status === 'resolved'`.
- **Validation**: Mongoose `pre-validate` hook prevents empty messages (no text AND no file).
