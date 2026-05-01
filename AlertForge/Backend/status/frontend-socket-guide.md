# 🔌 Frontend Socket Integration Guide

_Based on actual backend code — `config/socket.js` (updated 2026-05-02)_

---

## 1. Socket Authentication

The backend **requires** the API key in the handshake `auth.token` field.

```js
import { initializeSocket } from "@/services/socket";
const socket = initializeSocket("your-api-key-here");
```

## 2. Joining Rooms

### Service War Room
Join the default room for your organization.
```js
socket.emit("join_warroom", null, (ack) => {
  if (ack.success) console.log("Joined:", ack.room);
});
```

### Incident War Room
Join a specific incident's room (Deep-link).
```js
socket.emit("join_incident_room", { incidentId: "INC-123" }, (ack) => {
  if (ack.success) {
    // ack includes: room, count, messages (history), status
    setIncidentStatus(ack.status);
  }
});
```

## 3. Real-Time Events

| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `incident:new` | `{ incident }` | New incident notification |
| `incident:update` | `{ incident }` | Status change (Open -> Resolved) |
| `incident:resolved`| `{ incidentId }` | Broadcast to lock down chat |
| `room:presence` | `{ count }` | Live participant count |
| `chat:message` | `{ id, content, fileUrl, fileType, sender, createdAt }` | New chat message |
| `error:event` | `{ type, message }` | System error (Auth/Validation) |

## 4. Chat & File Sharing

### Sending a message
```js
socket.emit("chat:message", {
  content: "Checking the servers...",
  fileUrl: null,
  fileType: null
}, (ack) => {
  if (ack.success) console.log("Delivered");
});
```

### Sending a file
Files must be uploaded to the backend first via POST `/api/upload`.
```js
// 1. Upload
const formData = new FormData();
formData.append("file", file);
const res = await fetch("/api/upload", { method: "POST", body: formData });
const data = await res.json();

// 2. Send Metadata via Socket
socket.emit("chat:message", {
  content: "Shared a document",
  fileUrl: data.url,
  fileType: data.fileType // "image" or "pdf"
});
```

## 5. Implementation Best Practices

1. **Manual Send**: Use a `pendingFile` state. Never auto-send on file selection.
2. **Read-Only Mode**: Always check `incidentStatus === "resolved"` before allowing a `chat:message` emit.
3. **Deduplication**: Always check `message.id` in your local state before appending a new broadcast message.
4. **Cleanup**: Call `socket.off(eventName)` in your component's cleanup function.

---
**Standard Socket URL**: `http://localhost:3000` (or `VITE_API_BASE_URL`)
