class ApiError extends Error {
    constructor(statusCode, message, errorCode = 'INTERNAL_ERROR', details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;
        this.success = false;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;