/**
 * QUICK TEST: Connects as a socket client and joins a war room.
 * Run with: node scratch/test-socket.js
 * 
 * Prerequisites:
 * 1. Backend must be running (npm run dev)
 * 2. You need a valid API key from your database
 */

import { io } from "socket.io-client";

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const SERVER_URL = "http://localhost:3000";

// Replace this with a real API key from your DB (ApiKey collection)
const TEST_API_KEY = "your-api-key-here";
const TEST_NAME = "Test User";
// ────────────────────────────────────────────────────────────────────────────

const socket = io(SERVER_URL, {
    auth: {
        apiKey: TEST_API_KEY,
        name: TEST_NAME,
    },
    transports: ["websocket"],
});

socket.on("connect", () => {
    console.log(`✅ Connected as socket: ${socket.id}`);
    console.log("➡️  Joining war room...");

    socket.emit("join_warroom", {}, (ack) => {
        if (ack?.success) {
            console.log(`✅ Joined room: "${ack.room}"`);
            console.log(`👥 Online count: ${ack.count}`);
            console.log(`💬 Recent messages: ${ack.messages?.length}`);
            console.log("\n✅ CHECK UPSTASH DATA BROWSER NOW — you should see:");
            console.log(`   Key: presence:room:${ack.room}`);
            console.log(`   Value: { "${socket.id}" }`);
            console.log("\nPress Ctrl+C to disconnect (count will drop to 0).");
        } else {
            console.error("❌ Failed to join:", ack?.message);
            process.exit(1);
        }
    });
});

socket.on("room:presence", ({ room, count }) => {
    console.log(`[Presence Update] Room: ${room}, Online: ${count}`);
});

socket.on("connect_error", (err) => {
    console.error("❌ Connection failed:", err.message);
    console.log("Make sure the backend is running and the API key is valid.");
    process.exit(1);
});

socket.on("disconnect", () => {
    console.log("🔌 Disconnected from server.");
});
