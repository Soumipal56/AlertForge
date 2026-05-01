# 🏠 WAR ROOM — STATUS

_Last updated: 2026-05-01_

---

## ✅ DONE

| Feature | Where |
| :--- | :--- |
| Live incident list (socket-driven) | `WarRoom.jsx` — `handleNewIncident` |
| Incident deduplication / upsert | `WarRoom.jsx` — `upsertIncident()` |
| Live status update | `WarRoom.jsx` — `handleIncidentUpdate` |
| Timeline event log | `WarRoom.jsx` — `handleTimelineEvent` |
| Quick resolve button | `WarRoom.jsx` — `PATCH /api/incidents/:id/status` |
| Create incident form | `WarRoom.jsx` — `handleCreateIncident` |
| API key input (saved to localStorage) | `WarRoom.jsx` — `API_KEY_STORAGE_KEY` |
| Socket handshake auth (API key) | `services/socket.js` — `auth: { token }` |
| Socket reinitialization on key change | `WarRoom.jsx` — `reinitializeSocket()` |
| Auto `join_room` on service input | `WarRoom.jsx` — `handleServiceChange` |
| Responder online count | `WarRoom.jsx` — `room:presence` listener |
| Active War Room name display | `WarRoom.jsx` — `activeRoom` state |
| Socket status indicator (green/red) | `WarRoom.jsx` — conditional className |
| Incident severity + status badges | `WarRoom.jsx` — `severityStyles`, `statusStyles` |

---

## ⚠️ PARTIAL

| Feature | Issue |
| :--- | :--- |
| API key auth for create/resolve | Key read from localStorage but not re-validated on every action — relies on server-side middleware |
| Incident re-fetch on key change | `getIncidents(apiKey)` is called but signature doesn't pass key — interceptor handles it from localStorage |

---

## ❌ NOT DONE

| Feature |
| :--- |
| War Room chat / messaging |
| Typing indicator |
| Persistent timeline (DB-backed) |
| Responder assignment ("I'm on it" claim) |
| SLA / time-to-resolve timer |
| Filter incidents by severity or service |
| Pagination / infinite scroll |
| Incident detail / drill-down page |

---

## 🔄 WAR ROOM DATA FLOW

```mermaid
flowchart TD
    User[User opens WarRoom]

    User -->|1 enter API key| LS[localStorage]
    User -->|2 type service name| JR[emit join_room]

    subgraph Boot
        LS -->|apiKey in localStorage| SS["socket.js<br/>auth.token = apiKey"]
        SS -->|WebSocket handshake| BE["Backend io.use middleware"]
        BE -->|validated| SIO[Socket.io Server]
    end

    subgraph REST
        LS -->|x-api-key interceptor| AX[axios]
        AX -->|GET /api/incidents| IC[Incident Controller]
        IC -->|fetch all| DB[(MongoDB)]
        DB -->|incident list| IC
        IC -->|JSON response| AX
        AX --> WR[WarRoom state]
    end

    JR --> SIO
    SIO -->|room:presence count| WR

    subgraph LiveUpdates
        SIO -->|incident:new| WR
        SIO -->|incident:update| WR
        SIO -->|timeline:event| WR
    end

    WR -->|render| UI[Live Dashboard]
```

---

## 🖥️ UI COMPONENT BREAKDOWN

```mermaid
flowchart LR
    WR[WarRoom Page]

    WR --> Header["Header Bar<br/>socket status - war room name<br/>responders online - incident count"]
    WR --> Left["Incidents Panel<br/>article per incident<br/>severity + status badge<br/>quick resolve button"]
    WR --> Right[Sidebar]

    Right --> Form["Create Incident Form<br/>api key - message - service - severity"]
    Right --> Timeline["Timeline Log<br/>live socket event feed"]
```

---

## 📊 STATE MAP

| State | Type | Updated By |
| :--- | :--- | :--- |
| `incidents` | `Incident[]` | REST fetch + `incident:new` + `incident:update` |
| `timeline` | `TimelineItem[]` | `incident:new`, `incident:update`, `timeline:event` |
| `socketStatus` | `"connected" \| "disconnected"` | socket `connect` / `disconnect` |
| `activeRoom` | `string` | `handleServiceChange` |
| `roomPresence` | `number` | `room:presence` event |
| `apiKey` | `string` | localStorage + form input |
| `form` | `{ message, service, severity }` | controlled inputs |
| `creating` | `boolean` | form submit lifecycle |
| `loading` | `boolean` | REST fetch lifecycle |
| `error` | `string` | any failed action |
