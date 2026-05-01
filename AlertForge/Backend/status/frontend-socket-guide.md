# 🔌 Frontend Socket Integration Guide

_Based on actual backend code — `config/socket.js` (updated 2026-05-01)_

---

## Before You Start

- Backend is running on `http://localhost:3000`
- You have a valid API key (get one from `POST /api/apikeys`)
- `socket.io-client` is already installed in the frontend (`services/socket.js` exists)

---

## Step 1 — Import the socket helpers

These three functions are all you need from `services/socket.js`:

```js
import { initializeSocket, reinitializeSocket, getSocket } from "@/services/socket";
```

| Function | When to use |
| :--- | :--- |
| `initializeSocket(apiKey)` | First connect — returns socket instance |
| `reinitializeSocket(apiKey)` | API key changed — tears down old socket, makes a new one |
| `getSocket()` | Get the current socket anywhere (no re-init) |

---

## Step 2 — Connect the socket with the API key

The backend **requires** the API key in the handshake `auth.token` field.  
`initializeSocket` already does this for you.

```js
const socket = initializeSocket("your-api-key-here");
```

**What happens internally:**
```
socket.io-client → io(url, { auth: { token: "your-api-key" } })
  → Backend io.use middleware
  → hashKey(token) → DB lookup
  → if valid: socket.data.apiKey set, connection opens
  → if invalid: connect_error fired
```

**Listen for connection success / failure:**

```js
socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Auth failed:", error.message);
  // Show error to user — likely invalid API key
});
```

---

## Step 3 — Join the War Room

After connecting, emit `join_warroom`.  
**You do NOT pass a room name** — the backend resolves it automatically from your API key's `serviceName`.

```js
socket.emit("join_warroom", null, (ack) => {
  if (!ack.success) {
    console.error("Join failed:", ack.message);
    return;
  }

  console.log("Joined room:", ack.room);
  console.log("Responders online:", ack.count);
  console.log("Chat history:", ack.messages); // last 50 messages from MongoDB
});
```

**ACK response shape:**
```json
{
  "success": true,
  "room": "payment-gateway",
  "count": 3,
  "messages": [
    {
      "id": "abc123",
      "roomId": "payment-gateway",
      "content": "Checking logs now",
      "sender": { "name": "ops-team", "serviceName": "payment-gateway" },
      "createdAt": "2026-05-01T14:00:00.000Z"
    }
  ]
}
```

> ⚠️ `join_room` still works but is now a **deprecated alias** — it internally calls `join_warroom`. Use `join_warroom` directly.

---

## Step 4 — Listen for Live Incidents

These events are emitted from the incident controller after every DB write.  
They are **scoped to your service room** — you only get events for your service.

```js
// New incident created
socket.on("incident:new", (incident) => {
  console.log("New incident:", incident);
  // incident = { id, message, service, severity, status, createdAt, updatedAt }
  setIncidents((prev) => [incident, ...prev]);
});

// Incident status changed
socket.on("incident:update", (incident) => {
  console.log("Incident updated:", incident);
  setIncidents((prev) =>
    prev.map((item) => (item.id === incident.id ? { ...item, ...incident } : item))
  );
});

// Timeline activity entry
socket.on("timeline:event", (event) => {
  console.log("Timeline:", event.type, event.incident?.message);
  // event = { type: "incident.created" | "incident.status_changed", incident: {...} }
  setTimeline((prev) => [event, ...prev]);
});
```

---

## Step 5 — Track Responder Presence

Fires whenever someone joins or leaves the room, and on disconnect.

```js
socket.on("room:presence", ({ room, count }) => {
  console.log(`${count} responders online in ${room}`);
  setPresenceCount(count);
});
```

---

## Step 6 — Send a Chat Message

You must have called `join_warroom` successfully before sending.

```js
socket.emit("chat:message", { content: "Checking logs now" }, (ack) => {
  if (!ack.success) {
    console.error("Send failed:", ack.message);
    return;
  }
  // ack.message = the saved message payload (same shape as history messages)
  console.log("Sent:", ack.message);
});
```

**What happens internally:**
```
client emit "chat:message" { content }
  → backend validates content (not empty, not too long)
  → saves to MongoDB (WarRoomMessage collection)
  → io.to(room).emit("chat:message", savedMessage)
  → ALL clients in room receive it
```

---

## Step 7 — Receive Chat Messages

```js
socket.on("chat:message", (message) => {
  // message = { id, roomId, content, sender, createdAt, updatedAt }
  setMessages((prev) => {
    // Deduplicate by id
    if (prev.some((m) => m.id === message.id)) return prev;
    return [...prev, message];
  });
});
```

> 💡 Deduplicate by `id` — the sender receives the broadcast too (in addition to the ack).

---

## Step 8 — Handle Errors

The backend emits `error:event` for auth failures and validation problems.

```js
socket.on("error:event", ({ type, message }) => {
  // type: "AUTH_ERROR" | "VALIDATION_ERROR"
  console.error(`[${type}]`, message);
  setError(message);
});
```

---

## Step 9 — Handle API key change

If the user enters a different API key, tear down the old socket and start fresh.

```js
// When apiKey state changes:
const socket = reinitializeSocket(newApiKey);

// Then re-attach all your event listeners (useEffect with apiKey as dependency)
```

---

## Step 10 — Cleanup on unmount

Always remove listeners when the component unmounts to avoid memory leaks.

```js
useEffect(() => {
  const socket = initializeSocket(apiKey);

  socket.on("incident:new", handleNewIncident);
  socket.on("incident:update", handleIncidentUpdate);
  socket.on("timeline:event", handleTimelineEvent);
  socket.on("room:presence", handlePresence);
  socket.on("chat:message", handleChatMessage);
  socket.on("error:event", handleError);

  return () => {
    socket.off("incident:new", handleNewIncident);
    socket.off("incident:update", handleIncidentUpdate);
    socket.off("timeline:event", handleTimelineEvent);
    socket.off("room:presence", handlePresence);
    socket.off("chat:message", handleChatMessage);
    socket.off("error:event", handleError);
  };
}, [apiKey]);
```

---

## Full Event Reference

| Event | Direction | Payload | When |
| :--- | :--- | :--- | :--- |
| `join_warroom` | Client → Server | `null` | After connect, to enter room |
| `chat:message` (emit) | Client → Server | `{ content: string }` | Send a message |
| `incident:new` | Server → Client | `{ id, message, service, severity, status, createdAt, updatedAt }` | New incident created |
| `incident:update` | Server → Client | same as above | Incident status changed |
| `timeline:event` | Server → Client | `{ type, incident }` | Any incident activity |
| `room:presence` | Server → Client | `{ room, count }` | Someone joined / left / disconnected |
| `chat:message` (receive) | Server → Client | `{ id, roomId, content, sender, createdAt }` | New message in room |
| `error:event` | Server → Client | `{ type, message }` | Auth or validation failure |

---

## Common Mistakes

| Mistake | Fix |
| :--- | :--- |
| Emitting `chat:message` before `join_warroom` | Always wait for `join_warroom` ack with `success: true` |
| Not deduplicating `chat:message` on receive | Check `id` before adding to state — sender gets both ack AND broadcast |
| Re-creating socket on every render | Put `initializeSocket` inside `useEffect`, not at component top level |
| Not calling `socket.off` on unmount | Always return cleanup from `useEffect` |
| Passing a room name to `join_warroom` | Don't — backend ignores it and resolves from API key |
| Using `join_room` | It works (deprecated alias) but logs a warning; use `join_warroom` |

---

## Minimal Working Example

```jsx
import { useEffect, useState } from "react";
import { initializeSocket } from "@/services/socket";

export default function MySocketComponent({ apiKey }) {
  const [incidents, setIncidents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState(0);
  const [room, setRoom] = useState("");
  const [status, setStatus] = useState("disconnected");

  useEffect(() => {
    if (!apiKey) return;

    const socket = initializeSocket(apiKey);

    const onConnect = () => {
      setStatus("connected");
      socket.emit("join_warroom", null, (ack) => {
        if (!ack.success) return;
        setRoom(ack.room);
        setPresence(ack.count);
        setMessages(ack.messages || []);
      });
    };

    const onDisconnect = () => { setStatus("disconnected"); setPresence(0); };
    const onPresence = ({ count }) => setPresence(count);
    const onNewIncident = (inc) => setIncidents((p) => [inc, ...p]);
    const onUpdateIncident = (inc) =>
      setIncidents((p) => p.map((i) => (i.id === inc.id ? { ...i, ...inc } : i)));
    const onChatMessage = (msg) =>
      setMessages((p) => p.some((m) => m.id === msg.id) ? p : [...p, msg]);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:presence", onPresence);
    socket.on("incident:new", onNewIncident);
    socket.on("incident:update", onUpdateIncident);
    socket.on("chat:message", onChatMessage);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:presence", onPresence);
      socket.off("incident:new", onNewIncident);
      socket.off("incident:update", onUpdateIncident);
      socket.off("chat:message", onChatMessage);
    };
  }, [apiKey]);

  const sendMessage = (content) => {
    const socket = initializeSocket(apiKey);
    socket.emit("chat:message", { content }, (ack) => {
      if (!ack.success) console.error(ack.message);
    });
  };

  return (
    <div>
      <p>Status: {status} | Room: {room} | Online: {presence}</p>
      <p>Incidents: {incidents.length}</p>
      <button onClick={() => sendMessage("Hello war room!")}>Send</button>
    </div>
  );
}
```
