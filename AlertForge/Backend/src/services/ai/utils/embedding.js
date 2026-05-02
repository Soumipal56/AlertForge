import { MistralAIEmbeddings } from "@langchain/mistralai";
import appConfig from "../../../config/appConfig.js";

let embeddings = null;

if (appConfig.MistralApiKey) {
    embeddings = new MistralAIEmbeddings({
        apiKey: appConfig.MistralApiKey,
        model: "mistral-embed", // Mistral's embedding model
    });
} else {
    console.warn("[Embedding] Mistral API Key is missing. Embeddings will not work.");
}

/**
 * Converts text into an embedding vector.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} - The embedding vector.
 */
export const embedText = async (text) => {
    if (!embeddings) {
        console.warn("[Embedding] Client is not initialized.");
        return null;
    }
    
    if (!text || typeof text !== "string") {
        console.warn("[Embedding] Invalid text provided to embedText.");
        return null;
    }

    try {
        const result = await embeddings.embedDocuments([text]);
        
        if (!result || !Array.isArray(result) || result.length === 0 || !Array.isArray(result[0])) {
            console.warn("[Embedding] Provider returned invalid embedding format.");
            return null;
        }

        return result[0];
    } catch (error) {
        console.error(`[Embedding] Failed for text: ${text.substring(0, 50)}...`, error.message);
        return null;
    }
};
