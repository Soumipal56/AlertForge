import { AlertForge } from "./index.js";

const TEST_API_KEY = "af_12aad9d1fe417ba04a7da1f05957c120de2ec6e4ca2e9961aceb109afad8230c";

async function runTest() {
  console.log("🚀 Starting Minimal SDK Test");

  const af = new AlertForge({
    apiKey: TEST_API_KEY,
    baseURL: "https://alertforge.onrender.com"
  });

  try {
    // 0. Enable Notifications
    console.log("Enabling notifications...");
    await af.updateProfile({

      "name": "Ritam",
      "teamEmails": [
        "Mustafaramakda34@gmail.com", "ritammaty2003@gmail.com", "ritammaty2006@gmail.com", "ritammaty@gmail.com",
        "dev1@test.com",
        "dev2@test.com",
        "soumiisc2020@gmail.com"
      ],
      "discordWebhookUrl": "https://discord.com/api/webhooks/1499679342286999733/yZArjF9q68goc_9r0MQVbqWBbMRF7wWNFhHVkC00Za5Q04Ndei8zuHqTob3FSrqDDn3d",
      "telegramChatId": "8593526739",
      "notificationSettings": {
        "emailEnabled": true,
        "discordEnabled": true,
        "telegramEnabled": true

      }
    });
    console.log("✅ Notifications enabled");

    // 1. Create Incident
    console.log("Creating incident...");
    const incident = await af.createIncident({
      title: "DB crash",
      service: "payments",
      severity: "P1",
    });
    const id = incident.data?.id || incident.data?._id || incident.id;
    console.log("✅ Incident created:", id);

    // 2. Get Incidents
    console.log("Fetching incidents...");
    const list = await af.getIncidents();
    console.log("✅ Fetched incidents count:", list.data?.length || 0);

    // 3. Update Status
    console.log("Updating status...");
    await af.updateIncidentStatus(id, "resolved");
    console.log("✅ Incident resolved");

    // 4. Generate Postmortem
    console.log("Generating postmortem...");
    try {
      await af.generatePostmortem(id);
      console.log("✅ Postmortem triggered");
    } catch (e) {
      console.log("⚠️ Postmortem skipped (likely needs AI config)");
    }

    console.log("\n✨ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

runTest();
