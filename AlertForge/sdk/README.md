# AlertForge SDK

The official stateless SDK for AlertForge. Designed to be minimal, clean, and API-key driven.

## 🚀 Quick Start

### Installation

```bash
# Inside your project
npm install @alertforge/sdk
```

### Initialization

The SDK is entirely stateless. The only requirement is a valid API key.

```javascript
import { AlertForge } from "@alertforge/sdk";

const af = new AlertForge({
  apiKey: "af_your_secret_key",
  baseURL: "https://alertforge.onrender.com" // Defaults to production
});
```

## 📦 Features

### Incident Management

```javascript
// Create a new incident and broadcast notifications
const incident = await af.createIncident({
  title: "Database CPU Spike",
  service: "payments",
  severity: "P1"
});

// List all incidents
const list = await af.getIncidents();

// Update incident status
await af.updateIncidentStatus(incident.id, "resolved");
```

### User Profile & Notifications

Configure where you want to receive alerts.

```javascript
await af.updateProfile({
  name: "Alert Admin",
  teamEmails: ["dev@company.com"],
  discordWebhookUrl: "https://discord.com/api/webhooks/...",
  telegramChatId: "123456789",
  notificationSettings: {
    emailEnabled: true,
    discordEnabled: true,
    telegramEnabled: true
  }
});
```

### AI Postmortem

Generate AI-driven analysis for resolved incidents.

```javascript
await af.generatePostmortem(incident.id);
```

## 🔑 Authentication

The SDK uses `x-api-key` header for all requests. 
- No JWT required.
- No login sessions.
- No cookies.

## 🧪 Testing

To run the internal integration tests:

```bash
cd sdk
node tests.js
```

## 🌐 Production URL
The SDK communicates with `https://alertforge.onrender.com` by default. You can override this in the constructor for local development.
