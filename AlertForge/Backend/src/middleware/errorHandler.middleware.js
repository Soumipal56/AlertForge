import ApiError from "../utils/ApiError";

export const errorHandler = (err, req, res, next) => {
    console.error(err); // Log the error for debugging  

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });    
    } else {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};