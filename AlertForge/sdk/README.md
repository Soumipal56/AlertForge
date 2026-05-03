# @alertforge/sdk

The official Node.js SDK for the AlertForge Incident Management Platform.

AlertForge is a stateless, production-grade incident response system. This SDK allows you to programmatically manage incidents, update notification profiles, and generate AI-powered postmortems using only an API Key.

---

## 🔑 Authentication

AlertForge uses a stateless API Key authentication model. You do not need to manage JWTs or user sessions.

1. Generate an API Key from the AlertForge Dashboard.
2. Initialize the SDK with the key.

---

## 🚀 Installation

```bash
npm install alertforge-sdk
```

---

## 🛠️ Usage

### Initialization

```javascript
import { AlertForge } from "@alertforge/sdk";

const af = new AlertForge({
  apiKey: "af_your_secret_key",
  baseURL: "https://alertforge.onrender.com" // Optional: defaults to production
});
```

### Incident Management

#### Create an Incident

Broadcasting will immediately trigger alerts across all configured channels (Email, Telegram, Discord).

```javascript
const incident = await af.createIncident({
  title: "High Error Rate in Checkout Service",
  service: "payments-api",
  severity: "P1"
});

console.log("Created Incident:", incident.data._id);
```

#### List Incidents

```javascript
const response = await af.getIncidents();
console.log("Incidents:", response.data.incidents);
```

#### Update Status

```javascript
await af.updateIncidentStatus("incident_id", "resolved");
```

### User Profile & Notifications ! important so that we can send notification to you

Configure where you want to receive your alerts.

```javascript
await af.updateProfile({
  name: "On-Call Engineer",
  teamEmails: ["alerts@company.com"],
  discordWebhookUrl: "https://discord.com/api/webhooks/...",
  telegramChatId: "987654321",
  notificationSettings: {
    emailEnabled: true,
    discordEnabled: true,
    telegramEnabled: true
  }
});
```

### AI Postmortem

Trigger an automated AI analysis of a resolved incident.

```javascript
await af.generatePostmortem("incident_id");
```

---

## 🧪 Development & Testing

To run the integration tests:

```bash
npm test
```

---

## 📜 License

MIT
