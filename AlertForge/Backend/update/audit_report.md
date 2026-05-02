# 🚀 AlertForge Backend Documentation

## 1. Overview
AlertForge is a production-grade incident management and real-time alerting platform. It provides a robust backend for monitoring service health, dispatching multi-channel notifications (Email, Telegram, Discord), and facilitating collaboration via real-time "War Rooms."

- **Core Capabilities**: Incident tracking, AI-powered postmortems, multi-channel fan-out alerts, and real-time socket communication.
- **Maturity Level**: **Advanced Core**. The incident response engine and AI pipeline are highly mature, while administrative platform features (team management, public status pages) are currently in the implementation phase.

---

## 2. Folder Structure
The backend follows a strictly decoupled **Layered Architecture (Controller-Service-DAO)**.

```text
Backend/
├── src/
│   ├── config/          # App constants, DB, Redis, and Socket configurations
│   ├── controller/      # Request handling and response formatting
│   ├── dao/             # Data Access Objects for direct DB interactions
│   ├── middleware/      # Auth, Error handling, and Rate limiting
│   ├── model/           # Mongoose schemas (MongoDB)
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic (AI, Notifications, Sockets)
│   ├── utils/           # Shared helpers (Tokens, Hashing, API Responses)
│   └── validators/      # Zod/Joi schemas for input validation
├── scratch/             # Temporary debug and testing scripts
└── server.js            # Main entry point
```

---

## 3. Core Modules Breakdown

### 3.1 Auth Module
- **Routes**: `/api/auth/register`, `/login`, `/refresh`, `/google`, `/me`.
- **Controllers**: `auth.controller.js`.
- **Flow**: Supports **Smart Auth** (Dual Flow).
    - **Dashboard Flow**: JWT-based access tokens stored in HttpOnly cookies.
    - **SDK Flow**: API Key validation via `x-api-key` header.
- **Middleware**: `smartAuth.middleware.js` resolves identity for both flows.

### 3.2 Incident Module
- **APIs**: `GET /api/incidents`, `POST /api/incidents`, `PATCH /api/incidents/:id/status`.
- **Model**: `Incident.model.js` tracks severity, status, service, and resolution timestamps.
- **Features**: Automatic timeline logging and AI postmortem trigger upon resolution.

### 3.3 War Room / Socket Module
- **Real-time Logic**: Powered by Socket.IO with a Redis adapter for scalability.
- **Rooms**: Dynamic rooms created for `incident:${id}` and `${serviceName}`.
- **Events**:
    - `chat:message`: Real-time conversation persistence.
    - `room:presence`: Live responder count tracking.
    - `incident:update`: Instant dashboard synchronization.

### 3.4 Postmortem Module
- **AI Flow**: Uses **LangGraph** (Mistral/Anthropic) to analyze incident timelines.
- **Nodes**: Summary -> Root Cause -> Action Items -> Learning -> Validator.
- **Storage**: `Postmortem.model.js` stores structured AI outputs and external knowledge (Tavily).

### 3.5 Integration Module
- **UptimeRobot**: Dedicated webhook controller (`/api/webhooks/uptimerobot`) that handles standard and Discord-formatted payloads.
- **SDK**: Generic ingestion endpoint compatible with any backend reporting tool via API Keys.

---

## 4. Database Models Summary

| Model | Purpose | Key Fields |
| :--- | :--- | :--- |
| **User** | Identity & Settings | `email`, `role`, `notificationSettings`, `teamEmails`. |
| **Incident** | Core Event Tracking | `message`, `service`, `severity`, `status`, `resolvedAt`. |
| **ApiKey** | Authentication | `key` (hashed), `user`, `serviceName`. |
| **Service** | Asset Registry | `name`, `status` (operational/degraded/outage). |
| **TimelineEvent** | Activity Feed | `type`, `incidentId`, `message`. |
| **Postmortem** | Post-Incident Analysis | `incidentId`, `summary`, `rootCause`, `actionItems`. |
| **WarRoomMessage** | Real-time Chat | `roomId`, `content`, `fileUrl`, `sender`. |

---

## 5. API Overview

### Auth
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Standard login
- `GET /api/auth/google` - OAuth initiation
- `GET /api/auth/me` - Fetch current user profile

### Incidents
- `GET /api/incidents` - List all incidents
- `POST /api/incidents` - Manually create incident
- `GET /api/incidents/:id` - Fetch single incident details
- `PATCH /api/incidents/:id/status` - Update status (e.g., Resolve)

### War Room & Messaging
- `GET /api/chat/history/:roomId` - Fetch historical messages
- `POST /api/upload` - Handle file attachments for chat

### Webhooks
- `POST /api/webhooks/uptimerobot` - Ingest UptimeRobot alerts

---

## 6. Realtime (Socket.IO)
The socket system ensures the dashboard feels "alive."

- **Rooms Usage**:
    - `incident:${id}`: Dedicated for an active investigation.
    - `global`: For high-level dashboard alerts.
- **Synced Live**:
    - New Incident alerts.
    - Status changes (Investigating -> Resolved).
    - Chat messages and file uploads.
    - Presence counts (how many responders are in the room).

---

## 7. Current Capability Mapping

✅ **Implemented Well**
- Multi-channel notification fan-out (Email, TG, Discord).
- Smart Auth (API Key + JWT).
- AI-Driven Postmortem generation.
- Real-time Incident updates via Sockets.

⚠️ **Partially Built**
- Service registry (Basic model exists, needs management APIs).
- API Key management (Creation exists, needs list/revoke).
- Presence (Count exists, needs user avatars).

❌ **Missing**
- Team invitation system and granular RBAC.
- Public status page with uptime calculation.
- Manual Incident severity editor inline.

---

## 8. Suggested Implementation Points

### 1. Add Team Invitation System
→ **What**: Allow admins to invite members via email.
→ **Where**: Create `models/Invite.model.js`, `controller/team.controller.js`, and `routes/team.routes.js`.
→ **How**: Link invites to the `User` model with a `pending` status.

### 2. Service Management APIs
→ **What**: CRUD for services being monitored.
→ **Where**: Create `routes/service.routes.js` and implement logic in `controller/service.controller.js`.
→ **How**: Integrate with `Incident.model.js` to update service status automatically.

### 3. Public Status Page API
→ **What**: Expose public status data without requiring auth.
→ **Where**: Create `routes/public.routes.js` and a specialized DAO to fetch only public incidents.
→ **How**: Use `Incident.model.js` filtered by `isPublic` (need to add this field to Timeline/Incident).

### 4. War Room Tasks & Notes
→ **What**: Separate persistence for tasks and notes.
→ **Where**: Add `type` field to `WarRoomMessage.model.js` or create dedicated collections.
→ **How**: Update socket listeners in `config/socket.js` to handle `task:toggle` events.
