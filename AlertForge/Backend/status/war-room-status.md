# WAR ROOM — STATUS

_Last updated: 2026-05-01_

---

## Done

- Real-time incidents work through socket emits after DB writes
- War room chat works through `join_warroom` and `chat:message`
- Socket auth uses API keys only
- Chat messages persist in MongoDB
- Timeline events now persist in MongoDB
- Presence updates are broadcast with `room:presence`

---

## Fixed

- Timeline is no longer in-memory only
- Chat persistence was moved into `services/chat/chat.service.js`
- Presence tracking was moved into `services/socket/presence.service.js`
- CORS now reads from `process.env.CLIENT_URL`
- Socket errors now use the standard `error:event` payload for runtime validation issues

---

## Partial / Future

- Presence is still in-memory and will reset on server restart
- Redis adapter is still not implemented
- Incident filtering by room/service is still handled by the current incident query flow

---

## Real Flow

```
API key
  → socket auth handshake
  → join_warroom
  → load room history
  → chat:message
  → validate
  → save to MongoDB
  → emit to room

Incident create/update
  → controller
  → DB write
  → timeline save
  → socket emit
  → frontend updates from events
```
