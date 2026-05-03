# AlertForge Auth & Redis Security Update

This document summarizes the changes made to the AlertForge backend to implement robust session invalidation, prevent token reuse attacks, and solve the "same-token collision" issue caused by rapid login/logout cycles.

---

## 1. Core Changes Implemented

### A. JWT Uniqueness (JTI Implementation)
*   **Problem**: JWTs generated for the same user in the same second resulted in identical token strings. If an old token was blacklisted, the new (identical) token would also be blocked.
*   **Solution**: Added a unique **JTI (JWT ID)** to every access and refresh token using `crypto.randomBytes(16)`.
*   **Affected Files**: `src/utils/token.js`

### B. Distributed Token Blacklisting
*   **Implementation**: Created a dedicated `tokenBlacklist.service.js` using the Shared Redis connection (ioredis).
*   **Mechanism**: Stores blacklisted tokens as keys in Redis with a TTL (Time-To-Live) matching the token's remaining lifespan.
*   **Affected Files**: `src/services/redis/tokenBlacklist.service.js`

### C. State-Aware Logout
*   **Update**: The `logout` controller now extracts current cookies and actively pushes the `accessToken` and `refreshToken` into the Redis blacklist.
*   **Security Benefit**: Logged-out tokens are immediately invalidated system-wide, even if they haven't expired.
*   **Affected Files**: `src/controller/auth.controller.js`

### D. Hardened Middleware
*   **Update**: `smartAuth.middleware` now checks the Redis blacklist before proceeding with JWT verification.
*   **Enhanced Logs**: Added detailed server logs (`[Auth] Attempt - Cookie: ..., Bearer: ...`) to help diagnose frontend credential propagation issues.
*   **Affected Files**: `src/middleware/smartAuth.middleware.js`

---

## 2. Status & Next Steps

### Current Status: 🟢 COMPLETED
The backend now correctly handles token blacklisting and ensures every login session has a unique cryptographic identity.

### ⚠️ Required Updates (Action Items)

#### 1. Frontend LocalStorage Cleanup
The `LoginTest.jsx` and other authentication components should be updated to ensure `localStorage.setItem("alertforge.accessToken", ...)` is called. Currently, some test components rely only on cookies, which can be inconsistent across different browser environments or ports (e.g., localhost:5173 to localhost:3000).

#### 2. Token Rotation Verification
The `refresh` route now checks the blacklist. Ensure the frontend correctly handles a `401` response from the refresh endpoint by redirecting to `/login`.

#### 3. Redis Connection Stability
The blacklisting relies on Redis. In production (Render/Upstash), ensure the `REDIS_URL` uses the `rediss://` protocol (RESP) to maintain the persistent connection required for fast auth checks.

#### 4. Clear Site Data on Logout
For maximum security, consider adding the `Clear-Site-Data` header to the logout response to ensure the browser wipes all session-related metadata.

---

**Last Updated**: 2026-05-03
**Status**: Backend Hardening Complete
