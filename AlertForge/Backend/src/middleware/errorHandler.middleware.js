import { ERROR_MESSAGES, HTTP_STATUS } from "../config/constants.js";

export const errorHandler = (err, req, res, next) => {
    console.error(err); // Log the error for debugging  

    if (err.statusCode) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER).json({
        success: false,
        message: ERROR_MESSAGES.GENERAL.INTERNAL_SERVER,
    });
};
