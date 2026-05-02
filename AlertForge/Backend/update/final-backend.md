# AlertForge Backend — Final Production Documentation

> **System:** Production-grade Incident Management Platform (PagerDuty Lite)  
> **Stack:** Node.js · Express · MongoDB · Socket.IO · Redis · LangGraph AI

---

## 1. Architecture Overview

```
Request → CORS → Rate Limiter → Route
                                  ↓
                    smartAuth Middleware (Cookie/API Key)
                                  ↓
                    RBAC Middleware (role check)
                                  ↓
                    Controller (validate, call service)
                                  ↓
                    Service (business logic, lifecycle rules)
                                  ↓
                    DAO (DB queries, scoped by apiKeyId/userId)
                                  ↓
                    MongoDB (Mongoose Models)
```

### Auth Flows
```
Dashboard:    Login → Cookie (accessToken) → smartAuth reads cookie → req.user = { userId }
SDK/External: API Key in x-api-key header  → smartAuth hashes key   → req.user = apiKey.user
```

---

## 2. Feature Status

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Dashboard Overview | Complete | Status filter, counts aggregation |
| 2 | Incident Management | Complete | Strict lifecycle, severity, responders |
| 3 | Timeline System | Complete | Auto-log, manual notes, pagination |
| 4 | War Room | Enhanced | Structured types (task/note/file) |
| 5 | Postmortem | Enhanced | AI generation + manual edit endpoint |
| 6 | Service Registry | Complete | CRUD, status, uptime, incident count |
| 7 | API Key Management | Complete | Create (show-once), list, revoke |
| 8 | Team System | Complete | Invite, role management, member removal |
| 9 | Status Page | Complete | Public endpoint, no auth required |
| 10 | RBAC | Complete | admin / responder / viewer roles |

---

## 3. API Reference

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | None | Register with email/password |
| POST | /api/auth/login | None | Login, returns cookies |
| POST | /api/auth/logout | Cookie | Clears session cookies |
| GET | /api/auth/me | Cookie | Get current user profile |

### Incidents (Features 1 + 2)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/incidents | Cookie/API Key | List incidents (status filter + counts) |
| POST | /api/incidents | Cookie/API Key | Create incident |
| GET | /api/incidents/:id | Cookie/API Key | Get single incident |
| PATCH | /api/incidents/:id/status | Cookie/API Key | Advance lifecycle |
| PATCH | /api/incidents/:id/severity | Cookie/API Key | Update severity |
| GET | /api/incidents/:id/timeline | Cookie/API Key | Get paginated timeline |
| POST | /api/incidents/:id/timeline | Cookie/API Key | Add manual note |

### Service Registry (Feature 6)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/services | Cookie/API Key | List all services |
| POST | /api/services | Cookie/API Key | Create service |
| PATCH | /api/services/:id | Cookie/API Key | Update service fields |
| PATCH | /api/services/:id/status | Cookie/API Key | Update operational status |
| DELETE | /api/services/:id | Cookie/API Key | Delete service |

### API Key Management (Feature 7)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/apikeys | Cookie | List all API keys |
| POST | /api/apikeys | Cookie | Create API key (shown once) |
| DELETE | /api/apikeys/:id | Cookie | Revoke an API key |

### Postmortem (Feature 5)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/postmortem/:incidentId | Cookie/API Key | Fetch postmortem |
| POST | /api/postmortem/generate/:incidentId | Cookie/API Key | Trigger AI generation |
| PATCH | /api/postmortem/:incidentId | Cookie/API Key | Manually edit postmortem |

### Team System (Feature 8)
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | /api/team/members | admin | List team |
| POST | /api/team/invite | admin | Invite member |
| PATCH | /api/team/role | admin | Change role |
| DELETE | /api/team/member/:id | admin | Remove member |

### Status Page (Feature 9)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/status-page/public/:userId | **None** | Public status page |

---

## 4. Incident Lifecycle

```
active → investigating → identified → monitoring → resolved (IMMUTABLE)
         └──────────── No backward transitions ───────────────────────┘
```

- On create: `startedAt = now`, `responders = [creator]`
- On resolve: `resolvedAt = now`, AI postmortem triggered

---

## 5. RBAC Matrix

| Action | admin | responder | viewer |
|--------|-------|-----------|--------|
| Create/update incidents | Yes | Yes | No |
| View incidents | Yes | Yes | Yes |
| Invite team members | Yes | No | No |
| Manage API keys | Yes | No | No |
| Edit postmortem | Yes | Yes | No |

---

## 6. Testing Guide

```http
# 1. Register & Login
POST /api/auth/register { "email": "admin@test.com", "password": "pass123", "name": "Admin" }
POST /api/auth/login    { "email": "admin@test.com", "password": "pass123" }

# 2. Create an incident
POST /api/incidents { "title": "DB spike", "service": "payments", "severity": "P1" }

# 3. Advance lifecycle
PATCH /api/incidents/:id/status { "status": "identified" }
PATCH /api/incidents/:id/status { "status": "monitoring" }
PATCH /api/incidents/:id/status { "status": "resolved" }  # triggers AI postmortem

# 4. View timeline
GET /api/incidents/:id/timeline?page=1&limit=10

# 5. Public status page (no auth)
GET /api/status-page/public/:userId
```
