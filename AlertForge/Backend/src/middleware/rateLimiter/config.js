/**
 * RATE LIMITER CONFIGURATION
 * 
 * Rules for both Express APIs and Socket.IO events.
 */

const isProd = process.env.NODE_ENV === "production";

export const rateLimitConfig = {
    // REST API Limits (using express-rate-limit)
    api: {
        public: {
            windowMs: 60 * 1000, // 1 minute
            max: 60,            // 60 requests
            message: { success: false, message: "Too many requests from this IP, please try again after a minute." }
        },
        auth: {
            windowMs: 60 * 1000, // 1 minute
            max: 5,           // 200 requests
            message: { success: false, message: "API key rate limit exceeded. Please slow down." }
        },
        critical: {
            windowMs: 60 * 1000, // 1 minute
            max: 20,            // 10 requests burst protection
            message: { success: false, message: "Critical operation rate limit hit. Please try again later." }
        },
        heavy: {
            windowMs: 60 * 1000, // 1 minute
            max: 10,           // 10 uploads per minute
            message: { success: false, message: "Upload limit reached. Please wait before sharing more files." }
        }
    },

    // Socket.IO Limits (Custom logic)
    socket: {
        message: {
            windowSeconds: 1,
            limit: 2, // 3 messages per second
        },
        typing: {
            windowSeconds: 2,
            limit: 1, // 1 event per 2 seconds
        },
        join: {
            windowSeconds: 60,
            limit: 6, // 10 joins per minute
        }
    }
};
