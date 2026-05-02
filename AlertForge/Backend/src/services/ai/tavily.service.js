import appConfig from "../../config/appConfig.js";
import { storeExternalKnowledgeInPinecone } from "./utils/pinecone.js";

/**
 * Service to fetch real-world solutions for incidents using Tavily Search API.
 * Used to enrich incident data context for postmortems and AI processing.
 * 
 * Why Tavily? It provides highly relevant, AI-optimized search results.
 * Why in the service layer? To cleanly separate external API logic from controllers.
 */
export const fetchTavilyInsights = async (message, service, severity) => {
    if (!appConfig.tavilyApiKey) {
        console.warn("[Tavily] API key missing");
        return { summary: "", sources: [] };
    }

    // Dynamic query generation based on incident details
    const query = `${severity || 'medium'} severity issue in ${service || 'system'}: ${message}. 
How do engineers debug, fix, and prevent this in production systems?`;
    
    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: appConfig.tavilyApiKey,
                query: query,
                search_depth: "basic",
                include_answer: true,
                max_results: 3
            }),
        });

        if (!response.ok) {
            throw new Error(`Tavily API responded with status ${response.status}`);
        }

        const data = await response.json();

        // Extract meaningful summary (limit length, remove noise)
        let summary = data.answer || "";
        
        if (!summary && data.results && data.results.length > 0) {
            summary = data.results.map(r => r.content).join(" ").substring(0, 800);
        }
        
        // Clean response: remove excessive whitespace and limit to 1000 chars to avoid prompt bloat
        summary = summary.replace(/\s+/g, ' ').trim().substring(0, 1000);

        const sources = (data.results || []).map(r => ({
            title: r.title,
            url: r.url
        }));
        
        const result = {
            summary,
            sources
        };
        console.log("[Tavily] Response:", result);
        return result;
    } catch (error) {
        // Non-blocking failure: Do NOT crash incident creation if Tavily is down
        console.error("[Tavily] failed: Search failed. Proceeding without insights:", error.message);
        return { summary: "", sources: [] };
    }
};
