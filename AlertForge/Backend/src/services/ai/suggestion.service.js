import { getMistralModel } from "./utils/llm.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Generates AI suggestions for an incident in the War Room.
 * @param {Object} incident - The incident object
 * @returns {Promise<string[]>} - Array of suggestions
 */
export const getWarRoomSuggestions = async (incident) => {
    try {
        const model = getMistralModel();
        
        const systemPrompt = `You are an expert Incident Response Lead at AlertForge. 
        Analyze the incident context and provide 3-5 concise, highly actionable "next steps" for the response team.
        Format: Return ONLY a JSON array of strings. No extra text.
        
        Example: ["Check database connection pool", "Scale service 'checkout' by 2 units", "Notify status page subscribers"]`;

        const humanPrompt = `Incident Details:
        Title: ${incident.title}
        Service: ${incident.service}
        Severity: ${incident.severity}
        Status: ${incident.status}
        Description: ${incident.message || "No description provided"}
        Real-world Insights: ${incident.realWorldInsights || "None"}
        
        Generate actionable suggestions.`;

        const response = await model.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(humanPrompt)
        ]);

        let content = response.content;
        
        // Basic cleaning in case the model wraps in markdown
        if (content.includes("```json")) {
            content = content.split("```json")[1].split("```")[0].trim();
        } else if (content.includes("```")) {
            content = content.split("```")[1].split("```")[0].trim();
        }

        const suggestions = JSON.parse(content);
        return Array.isArray(suggestions) ? suggestions : ["Monitor system logs", "Check service health", "Coordinate with team"];
    } catch (error) {
        console.error("[Suggestion Service] Error:", error.message);
        return [
            "Verify service connectivity",
            "Review recent deployments",
            "Check resource utilization (CPU/Memory)"
        ];
    }
};
