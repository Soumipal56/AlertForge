import axios from 'axios';

async function testApi() {
    const baseUrl = "http://localhost:3000/api/incidents";
    const incidentId = "69f68996ca8624e977b60212";
    const apiKey = "af_12aad9d1fe417ba04a7da1f05957c120de2ec6e4ca2e9961aceb109afad8230c";

    console.log(`Calling API: ${baseUrl}/${incidentId}/suggestions`);
    
    try {
        const response = await axios.get(`${baseUrl}/${incidentId}/suggestions`, {
            headers: {
                'x-api-key': apiKey
            }
        });
        console.log("Response Status:", response.status);
        console.log("Suggestions:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("API Call Failed:", err.response?.data || err.message);
    }
}

testApi();
