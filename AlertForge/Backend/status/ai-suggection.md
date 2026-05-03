The AI suggestion engine is integrated into both your *Socket.IO* flow and your *REST API*. Here is how you can use it in your frontend code:

### 1. Using it via Socket.IO (Automatic)
The engine is designed to trigger automatically when a responder joins a "War Room" for an incident.

*Frontend Implementation:*
javascript
import { io } from "socket.io-client";

const socket = io("YOUR_BACKEND_URL");

// 1. Join the incident room
socket.emit("room:join", { room: "incident:67c1...your_incident_id" });

// 2. Listen for the suggestion event
socket.on("room:suggestion", (data) => {
    console.log("AI Recommendations:", data.suggestions);
    // data.suggestions is an array like: 
    // ["Verify DB logs", "Check CPU usage", "Notify customers"]
    
    // You can display these in your War Room UI as a 'System Tip'
});


### 2. Using it via REST API (On-Demand)
If you want to manually refresh suggestions or show them outside of the chat, you can call the new endpoint.

*Endpoint:* GET /api/incidents/:id/suggestions

*Frontend Implementation:*
javascript
const fetchSuggestions = async (incidentId) => {
    const response = await fetch(`/api/incidents/${incidentId}/suggestions`, {
        headers: {
            "Authorization": `Bearer ${userToken}`,
            "x-api-key": "your-api-key"
        }
    });
    const data = await response.json();
    return data.data.suggestions;
};


### 3. How it "Thinks" (The Logic)
The engine looks at the following data points to generate its advice:
*   *Incident Title & Message*: To understand what broke.
*   *Severity*: To prioritize critical fixes over minor ones.
*   *Service Name*: To suggest service-specific logs or metrics.
*   *Real-world Insights*: It checks if there are previous notes or logs to give more specific advice.

### Summary for your Team:
*   *Event Name*: room:suggestion
*   *Payload*: { suggestions: string[] }
*   *API Route*: /api/incidents/:id/suggestions

You can now add a "Get AI Advice" button in your War Room UI or have them pop up automatically as a floating notification for the response team!