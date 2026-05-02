export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    INTERNAL_SERVER: 500,
};

export const ERROR_MESSAGES = {
    GENERAL: {
        INTERNAL_SERVER: "Internal Server Error",
        BAD_REQUEST: "Bad Request",
    },

    INCIDENT: {
        NOT_FOUND: "Incident not found",
        CREATION_FAILED: "Failed to create incident",
    },

    AUTH: {
        INVALID_API_KEY: "Invalid API Key",
        INVALID_CREDENTIALS: "Invalid email or password",
        INVALID_TOKEN: "Invalid or expired token",
        UNAUTHORIZED: "Authentication required",
    }
};

export const SUCCESS_MESSAGES = {
    INCIDENT: {
        CREATED: "Incident created successfully",
        FETCHED: "Incidents fetched successfully",
    }
};

export const INCIDENT_STATUS = {
    OPEN: "open",
    INVESTIGATING: "investigating",
    IDENTIFIED: "identified",
    MONITORING: "monitoring",
    RESOLVED: "resolved",
};

export const SEVERITY = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
};
