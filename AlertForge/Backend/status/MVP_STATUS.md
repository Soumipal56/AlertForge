# 🚀 MVP STATUS

_Last updated: 2026-05-01_

---

## ✅ DONE

| Feature                                   | File                                               |
| :---------------------------------------- | :------------------------------------------------- |
| Incident CRUD API                         | `incident.routes.js`, `incident.controller.js` |
| MongoDB Incident model                    | `Incident.model.js`                              |
| API key generation (POST /api/apikeys)    | `apikey.controller.js`                           |
| API key hashing (SHA-256)                 | `hashKey.js`                                     |
| API key DB validation (REST middleware)   | `apiKey.middleware.js`                           |
| API key DB validation (Socket auth)       | `socket.js` — `io.use()` middleware           |
| Socket.io server + singleton              | `config/socket.js`                               |
| `incident:new` emit                     | `socket.service.js` → `createIncident`        |
| `incident:update` emit                  | `socket.service.js` → `updateIncidentStatus`  |
| `timeline:event` emit                   | `socket.service.js` → both controllers          |
| War Room room scoping (`join_room`)     | `config/socket.js`                               |
| Responder presence tracking               | `config/socket.js` — in-memory Map              |
| `room:presence` broadcast               | `config/socket.js`                               |
| Room-scoped emit (service filter)         | `socket.service.js` — `resolveTarget()`       |
| Email notification (nodemailer)           | `email.service.js`                               |
| WhatsApp notification (Twilio)            | `whatsapp.service.js`                            |
| Frontend API client (axios + interceptor) | `services/api.js`                                |
| Frontend socket client + handshake auth   | `services/socket.js`                             |
| Frontend War Room dashboard               | `pages/WarRoom.jsx`                              |
| Live incident list (socket-driven)        | `WarRoom.jsx` — `upsertIncident`              |
| Timeline event log (socket-driven)        | `WarRoom.jsx` — `handleTimelineEvent`         |
| Quick resolve button (PATCH status)       | `WarRoom.jsx` — `handleQuickResolve`          |
| Auto `join_room` on service input       | `WarRoom.jsx` — `handleServiceChange`         |
| Responder online count display            | `WarRoom.jsx` — `room:presence` listener      |
| Socket reinitialization on key change     | `WarRoom.jsx` — `reinitializeSocket()`        |

---

## ⚠️ PARTIAL

| Feature            | Issue                                                 |
| :----------------- | :---------------------------------------------------- |
| WhatsApp recipient | Hardcoded `+91XXXXXXXXXX` — not dynamic            |
| Email recipient    | Hardcoded `ritammaty2005@gmail.com` — not dynamic  |
| Responder presence | In-memory only — resets on server restart; no Redis  |
| CORS               | Hardcoded `http://localhost:5173` — not env-driven |

---

## ❌ NOT DONE

| Feature                                                   |
| :-------------------------------------------------------- |
| Webhook ingestion endpoint (UptimeRobot / PagerDuty)      |
| In-app War Room chat / messaging                          |
| User accounts / JWT auth                                  |
| Redis adapter (multi-server Socket.io)                    |
| AI root cause analysis                                    |
| Audit log / incident history                              |
| Service registry (`Service.model.js` exists but unused) |
| Webhook log (`WebhookLog.model.js` exists but unused)   |
| Rate limiting on API routes                               |
| Error handling middleware wired to `app.js`             |

---

## 🔄 SYSTEM OVERVIEW

```mermaid
flowchart TD
    FE[React Frontend<br/>WarRoom.jsx]

    subgraph REST["REST (HTTP)"]
        API[axios<br/>api.js]
    end

    subgraph WS["WebSocket"]
        SC[socket.io-client<br/>socket.js]
    end

    FE --> API
    FE --> SC

    subgraph Backend
        MW[API Key Middleware<br/>apiKey.middleware.js]
        SMW[Socket Auth Middleware<br/>io.use - socket.js]
        IC[Incident Controller]
        AKC[ApiKey Controller]
        SVC[Incident Service]
        ASVC[ApiKey Service]
        SS[Socket Service<br/>socket.service.js]
        NS[Notification Service<br/>email + WhatsApp]
        DB[(MongoDB)]
        SIOC[Socket.io Server<br/>config/socket.js]
    end

    API -->|x-api-key header| MW
    MW --> IC
    MW --> AKC

    SC -->|auth.token| SMW
    SMW --> SIOC

    IC --> SVC
    SVC --> DB
    IC -->|fire & forget| NS
    IC --> SS
    SS --> SIOC

    AKC --> ASVC
    ASVC --> DB

    SIOC -->|incident:new| FE
    SIOC -->|incident:update| FE
    SIOC -->|timeline:event| FE
    SIOC -->|room:presence| FE
```

---

## 📦 MODEL SUMMARY

```mermaid
erDiagram
    Incident {
        string id
        string message
        string serviceId
        string severity
        string status
        datetime createdAt
        datetime updatedAt
    }

    ApiKey {
        string id
        string key
        string name
        string serviceId
        boolean isActive
        datetime createdAt
    }

    Service {
        string id
        string name
    }

    WebhookLog {
        string id
        string incidentId
        string payload
        datetime createdAt
    }

    Service ||--o{ Incident : generates
    Service ||--o{ ApiKey : owns
    Incident ||--o{ WebhookLog : logs
```

> `Service` and `WebhookLog` models exist in code but are **not wired to any route or controller yet**.

---

## 📡 API ROUTES

| Method    | Route                         | Auth         | Status       |
| :-------- | :---------------------------- | :----------- | :----------- |
| `POST`  | `/api/apikeys`              | ❌ None      | ✅           |
| `POST`  | `/api/incidents`            | ✅ x-api-key | ✅           |
| `GET`   | `/api/incidents`            | ✅ x-api-key | ✅           |
| `GET`   | `/api/incidents/:id`        | ✅ x-api-key | ✅           |
| `PATCH` | `/api/incidents/:id/status` | ✅ x-api-key | ✅           |
| `POST`  | `/api/webhooks`             | —           | ❌ Not built |
