import multer from "multer";

/**
 * Configure Multer to use memory storage.
 * This ensures files are not stored on the local disk before being sent to ImageKit.
 */
const storage = multer.memoryStorage();

/**
 * File filter to restrict uploads to specific MIME types.
 * Supported: JPEG, PNG, PDF.
 */
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are supported."), false);
    }
};

/**
 * Initialize Multer middleware with storage, size limits, and filters.
 * Limit: 5MB.
 */
export const uploadMiddleware = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: fileFilter,
});
