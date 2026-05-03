// sdk/tests/runTests.js
import { testAuth } from "./auth.test.js";
import { testIncidents } from "./incidents.test.js";
import { testWarRoom } from "./warroom.test.js";
import logger from "../core/utils/logger.js";
import { setBaseURL } from "../core/config/index.js";

// Set default test URL
setBaseURL("http://localhost:3000");

const runAll = async () => {
    logger.info("🚀 Starting AlertForge SDK Test Suite...");
    const start = Date.now();

    const results = {
        auth: await testAuth(),
        incidents: await testIncidents(),
        warroom: await testWarRoom(),
    };

    const end = Date.now();
    const duration = ((end - start) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(40));
    console.log("📊 SDK TEST SUMMARY");
    console.log("=".repeat(40));
    console.log(`Auth Tests:      ${results.auth ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`Incident Tests:  ${results.incidents ? "✅ PASSED" : "❌ FAILED"}`);
    console.log(`War Room Tests:  ${results.warroom ? "✅ PASSED" : "❌ FAILED"}`);
    console.log("-".repeat(40));
    console.log(`Total Duration:  ${duration}s`);
    console.log("=".repeat(40) + "\n");

    const allPassed = Object.values(results).every(v => v === true);
    if (!allPassed) {
        process.exit(1);
    }
};

runAll().catch(err => {
    logger.error("Test Suite Crashed:", err);
    process.exit(1);
});
