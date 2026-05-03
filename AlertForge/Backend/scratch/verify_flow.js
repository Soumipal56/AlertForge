import axios from 'axios';

async function verifyFullFlow() {
    const baseUrl = "http://localhost:3000/api/incidents";
    const apiKey = "af_12aad9d1fe417ba04a7da1f05957c120de2ec6e4ca2e9961aceb109afad8230c";

    try {
        // 1. Create a new incident
        console.log("Creating a new incident...");
        const createResponse = await axios.post(baseUrl, {
            title: "Verification Test Incident",
            service: "Auth-Service",
            severity: "P2",
            message: "Testing the AI suggestion engine flow."
        }, {
            headers: { 'x-api-key': apiKey }
        });

        const incident = createResponse.data.data;
        console.log("✅ Incident Created! ID:", incident._id);

        // 2. Get suggestions for this incident
        console.log(`\nRequesting suggestions for incident ${incident._id}...`);
        const suggestionResponse = await axios.get(`${baseUrl}/${incident._id}/suggestions`, {
            headers: { 'x-api-key': apiKey }
        });

        console.log("✅ Suggestions Received:");
        console.log(JSON.stringify(suggestionResponse.data.data.suggestions, null, 2));

    } catch (err) {
        console.error("❌ Flow Verification Failed:", err.response?.data || err.message);
    }
}

verifyFullFlow();
