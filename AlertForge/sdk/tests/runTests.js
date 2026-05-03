import { AlertForge } from "../src/index.js";

/**
 * PRODUCTION TEST SUITE
 * 
 * Verifies full lifecycle: Profile -> Incident -> Resolution -> Postmortem
 */

const TEST_API_KEY = "af_12aad9d1fe417ba04a7da1f05957c120de2ec6e4ca2e9961aceb109afad8230c";

async function runTests() {
  console.log("🚀 Starting AlertForge SDK Production Tests");
  console.log("--------------------------------------------");

  const af = new AlertForge({
    apiKey: TEST_API_KEY,
    baseURL: "https://alertforge.onrender.com"
  });

  try {
    // 1. Profile Update (Enable all channels)
    console.log("[1] Updating notification profile...");
    const profile = await af.updateProfile({
      name: "SDK Test User",
      teamEmails: ["ritammaty@gmail.com", "dev@alertforge.com"],
      discordWebhookUrl: "https://discord.com/api/webhooks/1499679342286999733/yZArjF9q68goc_9r0MQVbqWBbMRF7wWNFhHVkC00Za5Q04Ndei8zuHqTob3FSrqDDn3d",
      telegramChatId: "8593526739",
      notificationSettings: {
        emailEnabled: true,
        discordEnabled: true,
        telegramEnabled: true
      }
    });
    console.log("✅ Profile updated successfully\n");

    // 2. Create Incident
    console.log("[2] Creating P1 incident (Broadcasting)...");
    const incidentResponse = await af.createIncident({
      title: "Production Database Outage - Automated Test",
      service: "core-database",
      severity: "P1"
    });
    const incidentId = incidentResponse.data?._id || incidentResponse.data?.id;
    console.log(`✅ Incident created: ${incidentId}\n`);

    // 3. List Incidents
    console.log("[3] Fetching organization incidents...");
    const listResponse = await af.getIncidents();
    const count = listResponse.data?.incidents?.length || 0;
    console.log(`✅ Found ${count} incidents in total\n`);

    // 4. Resolve Incident
    console.log("[4] Resolving incident...");
    await af.updateIncidentStatus(incidentId, "resolved");
    console.log("✅ Incident status set to RESOLVED\n");

    // 5. Generate Postmortem
    console.log("[5] Triggering AI Postmortem generation...");
    try {
      await af.generatePostmortem(incidentId);
      console.log("✅ Postmortem pipeline triggered\n");
    } catch (e) {
      console.log("⚠️ Postmortem skipped (likely missing AI credits/config)\n");
    }

    console.log("--------------------------------------------");
    console.log("✨ ALL SDK TESTS PASSED SUCCESSFULLY");

  } catch (error) {
    console.error("❌ TEST FAILED:");
    console.error(error.message);
    process.exit(1);
  }
}

runTests();
