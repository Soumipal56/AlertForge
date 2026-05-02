# 🛡️ WAR ROOM — STATUS

_Updated: 2026-05-02_

---

## ✅ DONE

- **Incident-Specific Rooms**: Direct collaboration for specific incidents (`join_incident_room`).
- **Multi-Media Chat**: Support for text, images, and PDFs via ImageKit integration.
- **Persistence**: 100% of chat and timeline events are backed by MongoDB.
- **Read-Only Mode**: Resolved incidents automatically transition to read-only state.
- **Presence Tracking**: Real-time participant counts per room.
- **Identity Fallback**: Anonymous users are automatically assigned `User-1`, `User-2` identities.
- **Secure Auth**: Handshake-level API key verification.

---

## 🛠️ TECHNICAL STACK

- **Real-time**: Socket.io 4.x
- **Storage**: MongoDB (WarRoomMessages collection)
- **Cloud Media**: ImageKit.io
- **Middleware**: Multer (Memory Storage)

---

## ⚠️ LIMITATIONS (PARTIAL)

- **Presence Reset**: Participant counts live in memory and reset on server restart.
- **History Limits**: Current room join loads a fixed number of recent messages (no pagination).
- **File Expiry**: ImageKit files currently persist indefinitely; no auto-cleanup for old attachments.

---

## 🚀 CURRENT WORKFLOW

1. **Join**: User provides API key -> Handshake -> Join Room.
2. **Collaborate**: Post text/files. Files are uploaded via API then shared via Socket.
3. **Resolve**: Incident status updated -> Broadcast `incident:resolved` -> Chat locked.
4. **Audit**: History persists for post-mortem analysis.
