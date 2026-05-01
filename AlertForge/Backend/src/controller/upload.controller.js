import { uploadToImageKit } from "../services/upload/imagekit.service.js";

/**
 * Handles file upload requests.
 * Receives file from Multer, sends it to ImageKit, and returns the public URL.
 */
export const handleFileUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded." });
        }

        const file = req.file;
        const fileName = `${Date.now()}-${file.originalname}`;
        
        // Upload to ImageKit
        const uploadResult = await uploadToImageKit(file.buffer, fileName);

        return res.status(200).json({
            success: true,
            url: uploadResult.url,
            fileType: file.mimetype.includes("pdf") ? "pdf" : "image",
            name: file.originalname,
        });
    } catch (error) {
        console.error("[Upload Controller] Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "An error occurred during file upload.",
        });
    }
};
