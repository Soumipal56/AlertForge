# AlertForge Backend Audit Report

> **Auditor:** Antigravity (Senior Backend Architect)
> **Date:** May 2, 2026
> **Scope:** AlertForge Backend compared against `Features-Dashboard.md` spec.

---

## 1. Feature Coverage Analysis

| Section | Status | Notes |
| :--- | :--- | :--- |
| **Overview / Dashboard** | ⚠️ Partially Implemented | Incident list and creation exist. Missing inline severity/status editors. |
| **Incidents** | ✅ Implemented | Card data mostly supported. Filter counts/search need backend support. |
| **Incident Detail** | ⚠️ Partially Implemented | Timeline and status work. Missing "Analyse" (Active RC) and Responders management. |
| **War Room** | ⚠️ Partially Implemented | Socket chat works. Missing separate Tasks/Notes/Files tabs and individual presence. |
| **Postmortem** | ⚠️ Partially Implemented | AI generation is robust. Missing edit APIs and workflow status (Draft/Review/Pub). |
| **Services** | ❌ Missing | Basic model exists but no API endpoints or monitoring logic implemented. |
| **Integrations & API Keys** | ⚠️ Partially Implemented | UptimeRobot webhook works. API keys can be created but not listed or revoked. |
| **Status Page** | ❌ Missing | No public-facing APIs or uptime calculation logic found. |
| **Team** | ❌ Missing | No member management, invitation logic, or granular role support. |

---

## 2. Missing APIs / Endpoints

| Endpoint Path | Method | Purpose |
| :--- | :--- | :--- |
| `/api/incidents/:id/severity` | `PATCH` | Update incident severity inline without full update. |
| `/api/incidents/:id/responders` | `POST/DELETE` | Add/Remove responders to an incident. |
| `/api/incidents/:id/analyse` | `POST` | Trigger AI root cause analysis for an **active** incident. |
| `/api/warroom/:id/tasks` | `GET/POST/PATCH` | CRUD for tasks within a war room (separate from chat). |
| `/api/warroom/:id/notes` | `GET/POST` | Persistence for monospace notes. |
| `/api/postmortem/:id` | `PATCH` | Update/Edit postmortem sections (summary, root cause, etc.). |
| `/api/postmortem/:id/status` | `PATCH` | Advance postmortem workflow (Draft -> In Review -> Published). |
| `/api/services` | `GET/POST` | List and register new services. |
| `/api/services/:id/status` | `PATCH` | Manually override service status (Operational/Degraded/Outage). |
| `/api/apikeys` | `GET` | List all API keys for the team. |
| `/api/apikeys/:id` | `DELETE` | Revoke/Delete an API key. |
| `/api/team/members` | `GET` | List all team members with roles and activity. |
| `/api/team/invites` | `POST` | Send email invitation to new member. |
| `/api/status-page/public` | `GET` | Public data for status page (uptime, history). |

---

## 3. Database Schema Gaps

### ❌ Missing Collections
- **Invites**: For managing pending team invitations.
- **Tasks**: For war room and postmortem action items (currently under-structured).

### ⚠️ Schema Inconsistencies
| Model | Issue | Suggested Fix |
| :--- | :--- | :--- |
| `User` | Role enum mismatch. | Change to `['admin', 'responder', 'viewer']`. Add `status`. |
| `Incident` | Missing meta fields. | Add `responders (Array)`, `startedAt`, `detectionSource`, `duration`. |
| `Service` | Extremely skeletal. | Add `url`, `monitorType`, `uptimePercent`, `incidentCount`. |
| `Postmortem` | Missing workflow. | Add `status: { type: String, enum: ['draft', 'review', 'published'] }`. |
| `TimelineEvent` | Missing metadata. | Add `isPublic (Boolean)`, `author (ObjectId)`, `authorName`. |
| `WarRoomMessage` | Mixed content. | Add `type: { type: String, enum: ['message', 'note', 'task', 'file'] }`. |

---

## 4. Realtime (Socket.IO) Gaps

| Feature | Status | Recommendation |
| :--- | :--- | :--- |
| **Live Updates** | ✅ Done | `incident:new`, `incident:update`, `timeline:event` implemented. |
| **War Room Chat** | ✅ Done | Basic text/file messaging works. |
| **Presence** | ⚠️ Incomplete | Tracks socket count only. Needs `room:member_join` with user details. |
| **Task Updates** | ❌ Missing | Needs `task:update` to sync checklist state across responders. |
| **AI Suggestions** | ❌ Missing | Needs events to push AI checklist items live. |

---

## 5. AI Features Check

- **Root Cause Analysis**: ⚠️ Partial (Works for Postmortems, missing for active Incidents).
- **Postmortem Generation**: ✅ Done (Robust LangGraph implementation).
- **AI Suggestions**: ❌ Missing (No checklist or similar incident logic in backend).

---

## 6. Integration Gaps

- **UptimeRobot**: ✅ Done (Webhook handles both Discord and standard formats).
- **SDK Ingestion**: ✅ Done (Supported via API Key + Incident creation endpoints).
- **External Alerts**: ⚠️ Incomplete (No validation logic for generic external alerts beyond UptimeRobot).

---

## 7. Security & Auth Issues

- **Authentication**: ⚠️ Partially Implemented. Backend has custom JWT/Cookie logic, but Frontend still references Clerk in many places.
- **Authorization**: ❌ Missing. Role-based access control (RBAC) is defined in models but not enforced in middleware.
- **API Key Security**: ✅ Done. Hashing (SHA-256) is used for storage.
- **Input Validation**: ✅ Done. Zod/Joi validation present for incidents.

---

## 8. Final Summary

### 🚨 Critical Missing Features
1. **Team Management**: No way to manage users, roles, or invites.
2. **Service Registry**: Services exist in code but cannot be managed via API/Dashboard.
3. **Status Page Data**: No logic for uptime % or public status rendering.
4. **Responders Logic**: Incidents lack assigned responders, breaking the core collaboration model.

### ⚠️ Medium Priority Gaps
1. **War Room Tabs**: Persistence for Tasks vs Notes vs Chat is currently unified and needs separation.
2. **Presence Details**: Socket presence should show *who* is online, not just a count.
3. **Postmortem Workflow**: Needs state management (Draft -> Published).

### 🧩 Nice-to-have Improvements
1. **AI Checklist**: Real-time investigation steps pushed via socket.
2. **Audit Logs**: Track who changed what status and when.

---

## 9. Auditor Conclusion
The backend is **~55% complete** relative to the specification. The incident response and postmortem generation engines are highly advanced, but the supporting "platform" features (Team, Services, Status Page, RBAC) are either missing or in a skeletal state. 
