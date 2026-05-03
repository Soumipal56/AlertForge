import { getWarRoomSuggestions } from '../src/services/ai/suggestion.service.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function testSuggestions() {
    const mockIncident = {
        title: "Database CPU Spike",
        service: "Main-DB",
        severity: "P1",
        status: "Investigating",
        message: "Database CPU is at 98%. Response times are increasing."
    };

    console.log("Testing AI suggestions for incident:", mockIncident.title);
    try {
        const suggestions = await getWarRoomSuggestions(mockIncident);
        console.log("Suggestions received:", suggestions);
    } catch (err) {
        console.error("Test failed:", err.message);
    }
}

testSuggestions();
