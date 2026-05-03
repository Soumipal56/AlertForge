// sdk/core/utils/logger.js

const logger = {
    info: (...args) => console.log("[AlertForge SDK]", ...args),
    warn: (...args) => console.warn("[AlertForge SDK] WARN:", ...args),
    error: (...args) => console.error("[AlertForge SDK] ERROR:", ...args),
    debug: (...args) => {
        if (process.env.DEBUG === "true") {
            console.debug("[AlertForge SDK] DEBUG:", ...args);
        }
    }
};

export default logger;
