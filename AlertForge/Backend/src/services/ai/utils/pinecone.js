import { Pinecone } from "@pinecone-database/pinecone";
import appConfig from "../../../config/appConfig.js";
import { embedText } from "./embedding.js";

let pineconeClient = null;
let pineconeIndex = null;

try {
    if (appConfig.pinecone && appConfig.pinecone.apiKey && appConfig.pinecone.index) {
        pineconeClient = new Pinecone({
            apiKey: appConfig.pinecone.apiKey,
        });
        
        pineconeIndex = pineconeClient.index(appConfig.pinecone.index);
        console.log("[Pinecone] Successfully initialized client and connected to index.");
    } else {
        console.warn("[Pinecone] Missing configuration. Pinecone client will not be initialized.");
    }
} catch (error) {
    console.error("[Pinecone] Initialization error:", error);
}

/**
 * Store an incident in Pinecone
 */
export const storeIncidentInPinecone = async (incident) => {
    if (!pineconeIndex) {
        console.warn("[Pinecone] Skipping incident storage: Client not initialized");
        return;
    }

    if (!incident || !incident._id) {
        console.warn("[Pinecone] Skipping incident storage: Invalid incident object");
        return;
    }

    try {
        const service = incident.service || "unknown";
        const message = incident.message || "No message";
        const severity = incident.severity || "unknown";

        const text = `Service: ${service}, Issue: ${message}, Severity: ${severity}`;
        const embedding = await embedText(text);

        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
            console.warn(`[Pinecone] Skipping incident ${incident._id}: Embedding failed or returned empty`);
            return;
        }

        const record = {
            id: `incident_${incident._id.toString()}`,
            values: embedding,
            metadata: {
                type: "incident",
                service,
                message,
                severity,
                createdAt: incident.createdAt ? new Date(incident.createdAt).toISOString() : new Date().toISOString()
            }
        };

        const records = [record];

        console.log("[DEBUG] Incident Input:", incident._id);
        console.log("[DEBUG] Generated Text:", text);
        console.log("[DEBUG] Embedding Length:", embedding?.length);
        console.log("[DEBUG] Records:", records.length);

        if (!records || records.length === 0) {
            console.warn("[Pinecone] No valid records → skipping upsert");
            return;
        }

        console.log("[Pinecone] Final Payload:", { records: records });

        await pineconeIndex.upsert({ records: records });
        console.log(`[Pinecone] Successfully stored incident ${incident._id}`);
    } catch (error) {
        console.error("[Pinecone] Failed to store incident:", error);
    }
};

/**
 * Store war room chat messages in Pinecone
 */
export const storeChatInPinecone = async (messages, roomId) => {
    if (!pineconeIndex) {
        console.warn("[Pinecone] Skipping chat storage: Client not initialized");
        return;
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        console.warn("[Pinecone] Skipping chat storage: No messages provided");
        return;
    }
    
    try {
        const records = [];

        for (const message of messages) {
            // Check content and fileUrl
            const hasContent = typeof message.content === "string" && message.content.trim() !== "";
            const hasFile = !!message.fileUrl;

            // If both content & fileUrl empty -> SKIP
            if (!hasContent && !hasFile) {
                console.warn("[Pinecone] Skipped chat message: Empty content and no file");
                continue;
            }

            // Prepare text
            let content = hasContent ? message.content.trim() : "";
            
            // If content is empty (but it has fileUrl) -> skip or use fileUrl?
            // "If content is empty -> SKIP"
            if (!content) {
                console.warn("[Pinecone] Skipped chat message: Empty text");
                continue;
            }

            content = content.substring(0, 500); 
            const senderName = message.sender?.name || "System";
            const text = `${senderName}: ${content}`;
            
            try {
                const embedding = await embedText(text);
                if (embedding && Array.isArray(embedding) && embedding.length > 0) {
                    records.push({
                        id: `chat_${message._id.toString()}`,
                        values: embedding,
                        metadata: {
                            type: "chat",
                            incidentId: roomId.toString(),
                            sender: senderName,
                            content: content, // include content in metadata per requirements
                            createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : new Date().toISOString()
                        }
                    });
                }
            } catch (err) {
                console.warn(`[Pinecone] Embedding failed for text: ${text.substring(0, 50)}...`, err.message);
            }
        }

        console.log("[DEBUG] Chat Input count:", messages.length);
        console.log("[DEBUG] Records built:", records.length);

        if (!records || records.length === 0) {
            console.warn("[Pinecone] No valid records → skipping upsert");
            return;
        }

        console.log("[Pinecone] Final Payload:", { records: records });

        await pineconeIndex.upsert({ records: records });
        console.log(`[Pinecone] Stored ${records.length} records successfully for room ${roomId}`);
    } catch (error) {
        console.error("[Pinecone] Failed to store chat:", error);
    }
};

/**
 * Search for similar incidents in Pinecone
 */
export const searchSimilarIncidents = async (incident) => {
    if (!pineconeIndex) {
        console.warn("[Pinecone] Skipping search: Client not initialized");
        return "";
    }

    if (!incident) return "";

    try {
        const service = incident.service || "unknown";
        const message = incident.message || "No message";
        const severity = incident.severity || "unknown";

        const text = `Service: ${service}, Issue: ${message}, Severity: ${severity}`;
        const embedding = await embedText(text);

        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
            console.warn("[Pinecone] Skipping search: Embedding generation failed");
            return "";
        }

        const response = await pineconeIndex.query({
            vector: embedding,
            topK: 3,
            filter: { type: "incident" },
            includeMetadata: true
        });

        if (!response.matches || response.matches.length === 0) {
            console.log("[Pinecone] Found 0 similar incidents");
            return "";
        }

        // Format results
        const formattedResults = response.matches.map(match => {
            const meta = match.metadata || {};
            return `Similar Incident:\nService: ${meta.service || "unknown"}\nIssue: ${meta.message || "No message"}\nSeverity: ${meta.severity || "unknown"}`;
        });

        return formattedResults.join("\n\n");
    } catch (error) {
        console.error("[Pinecone] Search failed:", error);
        return "";
    }
};

/**
 * Store a finalized postmortem report in Pinecone
 * PREPARE FOR FUTURE SEARCH: Metadata includes type, incidentId, and service.
 */
export const storePostmortemInPinecone = async (postmortem, incident) => {
    if (!pineconeIndex) {
        console.warn("[Pinecone] Skipping postmortem storage: Client not initialized");
        return;
    }

    if (!postmortem || !postmortem.summary) {
        console.warn("[Pinecone] Skipping postmortem storage: Invalid postmortem object");
        return;
    }

    try {
        const service = incident?.service || "unknown";
        
        // Construct a dense, meaningful string for the embedding model to digest
        // We include rootCause and learnings as they are the most valuable for future AI context
        const text = `Service: ${service}\nSummary: ${postmortem.summary}\nRoot Cause: ${postmortem.rootCause}\nLearnings: ${postmortem.learnings}`;
        
        const embedding = await embedText(text);

        if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
            console.warn(`[Pinecone] Skipping postmortem ${postmortem._id || postmortem.incidentId}: Embedding failed`);
            return;
        }

        const incidentIdStr = (postmortem.incidentId || incident?._id || "unknown").toString();

        const record = {
            id: `postmortem_${incidentIdStr}`,
            values: embedding,
            metadata: {
                type: "postmortem",
                incidentId: incidentIdStr,
                service: service,
                createdAt: postmortem.createdAt ? new Date(postmortem.createdAt).toISOString() : new Date().toISOString()
            }
        };

        const records = [record];

        console.log("[DEBUG] Postmortem Input incidentId:", incidentIdStr);
        console.log("[DEBUG] Generated Text length:", text.length);
        console.log("[DEBUG] Embedding Length:", embedding?.length);
        console.log("[DEBUG] Records:", records.length);

        if (!records || records.length === 0) {
            console.warn("[Pinecone] No valid records → skipping upsert");
            return;
        }

        console.log("[Pinecone] Final Payload:", { records: records });

        await pineconeIndex.upsert({ records: records });
        console.log(`[Pinecone] Stored 1 records successfully for postmortem ${incidentIdStr}`);
    } catch (error) {
        console.error("[Pinecone] Failed to store postmortem:", error);
    }
};

export { pineconeClient, pineconeIndex };
