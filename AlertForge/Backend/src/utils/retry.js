import logger from "./logger.js";

/**
 * retry
 * @param {Function} fn - The async function to retry
 * @param {number} retries - Max number of retries
 * @param {number} delay - Initial delay in ms
 * @param {string} label - Context label for logging
 */
export const retry = async (fn, retries = 3, delay = 1000, label = 'Operation') => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const waitTime = delay * Math.pow(2, i);
            logger.warn(`[Retry] ${label} failed (attempt ${i + 1}/${retries}). Retrying in ${waitTime}ms... Error: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    logger.error(`[Retry] ${label} failed after ${retries} attempts.`);
    throw lastError;
};
