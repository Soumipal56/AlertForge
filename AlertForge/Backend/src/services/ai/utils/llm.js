import { ChatMistralAI } from "@langchain/mistralai";
import appConfig from "../../../config/appConfig.js";

let cachedMistralModel = null;

export const getMistralModel = () => {
    if (cachedMistralModel) return cachedMistralModel;

    if (!appConfig.MistralApiKey) {
        throw new Error("❌ MISTRAL_API_KEY is missing in environment variables");
    }

    cachedMistralModel = new ChatMistralAI({
        apiKey: appConfig.MistralApiKey, // ✅ IMPORTANT
        model: appConfig.MistralModel || "mistral-medium-latest",
        temperature: Number(appConfig.MistralTemperature ?? 0.2),
        maxRetries: 2,
    });

    return cachedMistralModel;
};