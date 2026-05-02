# 🔥 AlertForge Backend — Architecture Redesign

## 1. Current System Overview
AlertForge is a production-grade incident management system (PagerDuty Lite) built with a Node/Express/MongoDB stack. It successfully implements complex flows including multi-tenant team management, dual-mode authentication, AI-driven postmortems, and a real-time status page.

### Strengths
- **Rich Feature Set**: Covers the full incident lifecycle from detection to postmortem.
- **Dual-Mode Auth**: Cleanly handles both Dashboard (Cookie) and SDK (API Key) sessions.
- **Multi-Tenancy**: Built-in organization scoping for teams and API keys.
- **AI Integration**: Innovative use of LangGraph for automated root cause analysis.

---

## 2. Architecture Validation

| Feature | Status | Engineering Notes |
|---|---|---|
| Dashboard Overview | ✅ Correct | Solid aggregation queries, clean controller. |
| Incident Management | ⚠️ Partial | Lifecycle is enforced, but "Side Effects" (Timeline/Sockets) are leaked to the Controller. |
| Timeline System | ✅ Correct | Scoped correctly, supports manual and auto-logs. |
| War Room | ⚠️ Partial | Basic structure exists; needs full task/message orchestration. |
| Postmortem | ✅ Correct | Robust AI pipeline with manual override support. |
| Service Registry | ⚠️ Partial | Business logic is minimal; needs better service-layer abstraction. |
| API Key System | ✅ Correct | Secure hashing, rotation, and show-once logic implemented. |
| Team System | ✅ Correct | RBAC enforced; email invites working. |
| Status Page | ❌ Broken | **Architectural Violation**: Controller directly calls DAOs, bypassing Service layer. |
| RBAC Enforcement | ✅ Correct | Middleware-based role gating is robust. |

---

## 3. System Flow (Corrected)
The goal is to move from **Fat Controllers** to **Thin Controllers** with **Service Orchestration**.

**Current (Leaky):**
`Controller → [Zod Validate] → [Service Call] → [Manual Timeline Log] → [Manual Socket Emit] → [Manual Notification] → Response`

**Redesigned (Clean):**
`Controller → [Zod Validate] → [Service.execute] → Response`
*Inside Service:*
`Service → [DAO Query] → [TimelineService.log] → [SocketService.emit] → [NotificationService.send]`

---

## 4. Module-wise Design

### Auth & smartAuth
- **Current**: Correctly handles two paths.
- **Improvement**: Standardize `req.user` to always be a full object `{ id, email, role, organizationId }` regardless of auth source to simplify downstream logic.

### Incident Module
- **Current**: The Controller is over-responsible. It manually triggers timeline entries, sockets, and postmortems.
- **Redesign**: Move orchestration to `IncidentService.updateStatus`. The service should internally handle the timeline log and socket emission.
- **Fix**: Add missing index on `status` and `service` fields.

### Timeline Module
- **Current**: Controller-managed.
- **Redesign**: Expose a internal `autoLog` utility within `TimelineService` that other services can call without permission checks (since the service-to-service call is trusted).

### War Room
- **Current**: Skeleton message types.
- **Redesign**: Implement a `RoomService` that handles message persistence and ensures task updates trigger timeline events.

### Service Registry & Status Page
- **Current**: Status Page controller is a "God Object" calling DAOs directly.
- **Redesign**: Create a `StatusPageService`. The controller should only handle the HTTP response. Move the complex aggregation logic (uptime %, overall status) to the service layer.

---

## 5. Data Flow Diagram
```
Client Request
      ↓
[CORS / Rate Limiter]
      ↓
[smartAuth Middleware] (Populate req.user, req.apiKey)
      ↓
[RBAC Middleware] (Check Admin/Responder/Viewer)
      ↓
[Controller] (Zod Validate → Call Service)
      ↓
[Service] (Orchestration Hub) ──► [DAO] (DB Read/Write)
      │                       ──► [Timeline Service] (Auto-log)
      │                       ──► [Socket Service] (Real-time Broadcast)
      │                       ──► [Notification Service] (Fan-out)
      ↓
ApiResponse (Standardized Format)
```

---

## 6. Critical Fixes (High Priority)
1. **Index Missing**: `User.organizationId` and `Incident.status` have no indexes. This will kill performance at >1000 records.
2. **Architecture Leak**: `statusPage.controller.js` must be refactored to use a Service.
3. **Transactionality**: Use MongoDB sessions for `Incident Update + Timeline Log` to prevent "Ghost Updates" (status changes but no timeline record).

---

## 7. Performance Improvements
- **Pagination**: Implement `cursor-based pagination` for incidents and timeline events to handle high-frequency logs.
- **Aggregation Cache**: The Status Page aggregation is expensive. Cache the result in **Redis** for 60 seconds.
- **Lean Queries**: Use `.lean()` everywhere (mostly done, but audit remaining DAO methods).

---

## 8. Security Improvements
- **RBAC Hardening**: Ensure `organizationId` is checked in every single DAO method. Currently, some methods only use `apiKeyId`.
- **Data Minimization**: The `listApiKeys` endpoint must never return even the `hashedKey`.

---

## 9. Scalability Plan
- **Redis Pub/Sub**: Move Socket.IO from a single server to Redis adapter to support horizontal scaling.
- **Queueing**: Notifications (Email/SMS) should be moved to a background worker (BullMQ) to prevent API latency during network timeouts.

---

## 10. Final Verdict
**Backend Maturity: 78%**

The system is highly functional and logically sound. However, to reach **Production-Grade (100%)**, the "Leaky Abstractions" in the Incident and Status Page modules must be plugged. Moving side-effect orchestration (Timeline/Sockets) from the Controller to the Service layer is the single most important architectural step remaining.
