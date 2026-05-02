# Smart Incident Response Platform: Production-Ready Architecture

This document outlines the architectural overhaul required to transition **AlertForge** from a single-user prototype to a production-grade, multi-team incident response system (PagerDuty-style).

---

## 1. Architecture Analysis

### Current Flaws
1.  **Identity Fragility**: The system currently relies on `req.user` inside API-key-authenticated routes. Since API calls (from monitoring tools) don't have session cookies/JWTs, `req.user` is undefined, causing notification logic to crash.
2.  **Single Point of Failure (Notification)**: Alerts are sent to exactly one `userId`. In a production environment, an incident must notify a **Rotation** or a **Team**.
3.  **Missing Routing Layer**: There is no logic to determine *who* gets notified for *which* service. If "Database" fails, the DBA team should be paged; if "Frontend" fails, the UI team should be paged.
4.  **Implicit Ownership**: The relationship between API Key → User → Incident is too direct. We need an abstraction (Services/Teams) to allow multiple keys to trigger the same escalation policy.

---

## 2. Data Model Fixes

To support teams and professional routing, we must evolve the schema:

### A. Team / Organization Model (New)
Groups users together to receive collective alerts.
```javascript
const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
```

### B. Updated User Model
Focus on notification preferences and team membership.
```javascript
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    notificationSettings: {
        email: { enabled: Boolean, address: String },
        telegram: { enabled: Boolean, chatId: String },
        discord: { enabled: Boolean, webhookUrl: String },
        slack: { enabled: Boolean, webhookUrl: String }
    },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]
});
```

### C. Updated API Key Model
Link keys to a **Service** or **Team**, not just a single user.
```javascript
const apiKeySchema = new mongoose.Schema({
    key: { type: String, unique: true, index: true },
    service: { type: String, required: true }, // e.g., "payment-gateway"
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    isActive: { type: Boolean, default: true }
});
```

### D. Updated Incident Model
Track ownership and the responder.
```javascript
const incidentSchema = new mongoose.Schema({
    message: String,
    service: String,
    severity: String,
    status: { type: String, enum: ['open', 'acknowledged', 'resolved'] },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The person who "claimed" it
    apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey' }
});
```

---

## 3. Notification System Design

### Multi-User Fan-out
Instead of `sendToUser(userId)`, we implement `notifyTeam(teamId)`.
1.  Lookup all users in the `Team`.
2.  Filter users by their "On-Call" status (optional) or notify everyone.
3.  Trigger independent service calls (Email, Telegram, etc.) for each user based on their preferences.

### Notification Preferences Logic
Users should define **levels**:
- **Critical**: SMS + Telegram + Email.
- **Low**: Just Slack/Discord.

---

## 4. Incident Flow (Production Pipeline)

1.  **Ingestion**: Webhook (UptimeRobot/GitHub) hits `/api/webhooks/incoming?apiKey=...`.
2.  **Auth Middleware**: 
    - Validate API Key.
    - Attach `teamId` and `serviceName` to `req`.
3.  **Creation**: Incident is saved with `teamId`.
4.  **Routing (The "Brain")**:
    - The system identifies the `teamId` from the API Key.
    - It fetches all members of that team.
5.  **Notification Fan-out**:
    - Each member is paged via their preferred high-urgency channel.
6.  **War Room**: 
    - A Socket.io room is created: `warroom:{incidentId}`.
    - Team members join to debug.
7.  **Resolution**: 
    - Status updated to `resolved`.
    - "All Clear" notifications sent.

---

## 5. Required Backend Changes

### Middleware (`apiKeyAuth.js`)
Remove reliance on `req.user`. Extract `teamId` from the API key record.
```javascript
req.teamId = apiKeyDoc.teamId;
req.apiKeyId = apiKeyDoc._id;
```

### Controller (`incident.controller.js`)
Pass `teamId` to the creation service and notification service.

### Service Layer (`notification.service.js`)
Iterate over team members. Use `Promise.allSettled` to ensure one failed email doesn't stop others from receiving Telegrams.

---

## 6. Missing Features (Production-Ready)

| Feature | Why it's needed |
| :--- | :--- |
| **Deduplication** | If a server is flapping, don't send 100 alerts. Hash the `message + service` and ignore duplicates for 5 minutes. |
| **Escalation Logic** | If no one "Acknowledges" the incident in 10 minutes, notify the Manager. |
| **Rate Limiting** | Prevent "Notification Storms" if an API key is compromised or a script goes rogue. |
| **Responder Assignment** | Allow a user to click "Claim" to tell the team "I'm looking at this." |
| **Auto-Resolution** | If the webhook sends a "UP" signal, automatically resolve the "DOWN" incident. |

---

## 7. Clean Code Examples

### Fixed Controller (`createIncident`)
```javascript
export const createIncident = async (req, res, next) => {
    const { message, severity, service } = req.body;
    const { teamId, _id: apiKeyId } = req.apiKey; // Set by middleware

    const incident = await Incident.create({
        message,
        severity,
        service,
        teamId,
        apiKeyId,
        status: 'open'
    });

    // Notify the entire team associated with this API Key
    await NotificationService.notifyTeam(teamId, incident);

    res.status(201).json({ success: true, data: incident });
};
```

### Notification Dispatcher
```javascript
// services/notification.service.js
export const notifyTeam = async (teamId, incident) => {
    const team = await Team.findById(teamId).populate('members');
    
    const notifications = team.members.map(user => {
        return sendToUser(user, incident); // This checks individual preferences
    });

    await Promise.allSettled(notifications);
};
```

### User Lookup & Routing
```javascript
const sendToUser = async (user, incident) => {
    if (user.notificationSettings.telegram.enabled) {
        await telegram.send(user.notificationSettings.telegram.chatId, incident.message);
    }
    // ... repeat for other channels
};
```
