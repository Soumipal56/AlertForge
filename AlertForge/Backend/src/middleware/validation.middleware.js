import ApiError from "../utils/ApiError.js";
import { HTTP_STATUS } from "../config/constants.js";

/**
 * validationMiddleware
 * @param {import('zod').ZodSchema | import('joi').Schema} schema 
 * @param {'body' | 'query' | 'params'} source 
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
    try {
        let data = req[source];
        
        // Handle Zod
        if (schema.safeParse) {
            const result = schema.safeParse(data);
            if (!result.success) {
                throw new ApiError(
                    HTTP_STATUS.BAD_REQUEST, 
                    "Validation failed", 
                    'VALIDATION_ERROR', 
                    result.error.flatten().fieldErrors
                );
            }
            req[source] = result.data;
        } 
        // Handle Joi
        else if (schema.validate) {
            const { error, value } = schema.validate(data, { abortEarly: false });
            if (error) {
                throw new ApiError(
                    HTTP_STATUS.BAD_REQUEST, 
                    "Validation failed", 
                    'VALIDATION_ERROR', 
                    error.details
                );
            }
            req[source] = value;
        }
        
        next();
    } catch (err) {
        next(err);
    }
};
