# 🔌 SOCKET.IO — SYSTEM FLOW

_Last updated: 2026-05-01_

---

## 🏗️ IMPLEMENTATION STATUS

| Feature | Status |
| :--- | :--- |
| Socket.io server (`initSocket`) | ✅ |
| Singleton pattern (`getIo`) | ✅ |
| CORS config | ✅ |
| Auth middleware (`io.use`) | ✅ |
| API key validation in socket auth | ✅ |
| `join_room` handler | ✅ |
| `leave_room` handler | ✅ |
| Responder presence tracking | ✅ |
| `room:presence` broadcast | ✅ |
| `incident:new` emit | ✅ |
| `incident:update` emit | ✅ |
| `timeline:event` emit | ✅ |
| Room-scoped emit (service filter) | ✅ |
| Global fallback emit | ✅ |
| Frontend handshake auth (`auth.token`) | ✅ |
| Frontend `join_room` on service input | ✅ |
| Frontend socket reinitialization on key change | ✅ |
| Redis adapter (multi-server) | ❌ |
| War Room chat | ❌ |
| Persistent presence (DB-backed) | ❌ |

---

## 1️⃣ CONNECTION & AUTH FLOW

```mermaid
sequenceDiagram
    participant FE as Frontend WarRoom
    participant SC as socket.js client
    participant SMW as io.use middleware
    participant DB as MongoDB ApiKey
    participant SIO as SocketIO Server

    FE->>SC: reinitializeSocket()
    SC->>SIO: io(url, auth token)
    SIO->>SMW: intercept before connection
    SMW->>DB: findActiveApiKeyByHashedKey
    alt Valid Key
        DB-->>SMW: ApiKey doc
        SMW->>SIO: next() OK
        SIO-->>FE: socket.id assigned
        FE->>SIO: emit join_room payment-gateway
        SIO-->>FE: emit room:presence count
    else Invalid Key
        DB-->>SMW: null
        SMW->>SIO: next Error Authentication error
        SIO-->>FE: connect_error fired
    end
```

---

## 2️⃣ CREATE INCIDENT FLOW

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant MW as apiKey.middleware
    participant CTL as incident.controller
    participant SVC as incident.service
    participant DB as MongoDB
    participant SS as socket.service
    participant NS as notification.service
    participant SIO as SocketIO Server

    FE->>MW: POST /api/incidents x-api-key
    MW->>DB: findActiveApiKeyByHashedKey
    DB-->>MW: valid key
    MW->>CTL: next()
    CTL->>SVC: createIncidentService
    SVC->>DB: incidentModel.create
    DB-->>SVC: incident doc
    CTL-->>NS: sendIncidentNotification fire and forget
    CTL->>SS: emitNewIncident
    SS->>SIO: io.to service emit incident:new
    SIO-->>FE: incident:new received
    CTL->>SS: emitTimelineEvent incident.created
    SS->>SIO: io.to service emit timeline:event
    SIO-->>FE: timeline:event received
    CTL-->>FE: 201 Created
```

---

## 3️⃣ UPDATE INCIDENT FLOW

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant MW as apiKey.middleware
    participant CTL as incident.controller
    participant DB as MongoDB
    participant SS as socket.service
    participant SIO as SocketIO Server

    FE->>MW: PATCH /api/incidents/:id/status
    MW->>DB: findActiveApiKeyByHashedKey
    MW->>CTL: next()
    CTL->>DB: findByIdAndUpdate
    DB-->>CTL: updated doc
    CTL->>SS: emitIncidentUpdate
    SS->>SIO: io.to service emit incident:update
    SIO-->>FE: incident:update received
    CTL->>SS: emitTimelineEvent incident.status_changed
    SS->>SIO: io.to service emit timeline:event
    SIO-->>FE: timeline:event received
    CTL-->>FE: 200 OK
```

---

## 4️⃣ WAR ROOM PRESENCE FLOW

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant SIO as SocketIO Server
    participant MAP as roomPresence Map

    FE->>SIO: emit join_room database
    SIO->>MAP: roomPresence.get database add socketId
    SIO-->>FE: emit room:presence count 3

    Note over FE: User navigates away
    FE->>SIO: emit leave_room database
    SIO->>MAP: roomPresence.get database delete socketId
    SIO-->>FE: emit room:presence count 2

    Note over SIO: On disconnect
    SIO->>MAP: clean up all rooms for socketId
    SIO-->>FE: room:presence updated counts
```

---

## 5️⃣ FULL SYSTEM TOPOLOGY

```mermaid
flowchart TD
    subgraph Client["Browser"]
        WR[WarRoom.jsx]
        SC["socket.js client"]
        API["api.js - axios"]
    end

    subgraph Server["Node.js Server"]
        MW["REST Middleware<br/>x-api-key"]
        SMW["Socket Middleware<br/>io.use auth.token"]
        CTL[Incident Controller]
        SS["Socket Service<br/>resolveTarget"]
        SIOC[Socket.io Server]
        NS["Notification<br/>Email + WhatsApp"]
        DB[(MongoDB)]
        MAP["roomPresence<br/>in-memory Map"]
    end

    WR -->|HTTP REST| API
    API -->|x-api-key| MW
    MW --> CTL
    CTL --> DB
    CTL -->|fire and forget| NS
    CTL --> SS
    SS -->|io.to service room| SIOC

    WR -->|WebSocket| SC
    SC -->|auth.token| SMW
    SMW --> DB
    SMW --> SIOC
    SIOC --> MAP

    SIOC -->|incident:new| WR
    SIOC -->|incident:update| WR
    SIOC -->|timeline:event| WR
    SIOC -->|room:presence| WR
```

---

## 📦 EVENT REFERENCE

| Event | Direction | Payload | Scope |
| :--- | :--- | :--- | :--- |
| `incident:new` | Server → Client | `{ id, message, service, severity, status, createdAt, updatedAt }` | Service room / global |
| `incident:update` | Server → Client | `{ id, message, service, severity, status, createdAt, updatedAt }` | Service room / global |
| `timeline:event` | Server → Client | `{ type, incident: { ...payload } }` | Service room / global |
| `room:presence` | Server → Client | `{ room, count }` | Room members |
| `join_room` | Client → Server | `"service-name"` | — |
| `leave_room` | Client → Server | `"service-name"` | — |

---

## ⚠️ KNOWN LIMITATIONS

| Issue | Impact |
| :--- | :--- |
| Presence is in-memory | Resets on server crash/restart |
| No Redis adapter | Multi-server deploy will break socket routing |
| No chat events | War Room has no text messaging |
| CORS hardcoded | Must change before production deploy |
