# AlertForge SDK

The official JavaScript SDK for AlertForge. This SDK provides a modular, production-ready interface for interacting with the AlertForge incident management platform.

## 🚀 Features

- **Modular Design**: Choose only the modules you need (`auth`, `incidents`, `warroom`, etc.).
- **Dynamic Configuration**: Supports dynamic base URLs for local development and production.
- **Dual Auth**: Supports both JWT (Dashboard) and API Key (SDK/Automations) authentication.
- **Real-time Ready**: Integrated Socket.io client for War Room collaboration.

## 📦 Installation

```bash
# Future NPM command
npm install @alertforge/sdk
```

For local development, you can link this folder using `npm link` or directly import from the directory.

## 🔧 Configuration

```javascript
import { setBaseURL, setApiKey } from "./sdk";

// Local development defaults to http://localhost:3000
setBaseURL("http://localhost:3000");
setApiKey("your-org-api-key");
```

## 📖 Usage Examples

### Authentication
```javascript
import { auth } from "./sdk";

const session = await auth.login("admin@acme.com", "SecurePass123!");
console.log("Logged in:", session.user.name);
```

### Incident Management
```javascript
import { incidents } from "./sdk";

const newIncident = await incidents.createIncident({
    message: "High Latency in US-East-1",
    service: "Checkout Service",
    severity: "high"
});
```

### War Room & Sockets
```javascript
import { connectSocket, warroom } from "./sdk";

const socket = connectSocket();
warroom.joinWarRoom("incident-id-123");

warroom.listenToPresence(({ count }) => {
    console.log(`There are ${count} responders in the room.`);
});
```

## 🧪 Running Tests

The SDK includes a built-in test suite to validate integration with the AlertForge backend.

```bash
# Run all tests
node sdk/tests/runTests.js
```

## 📄 License

MIT
