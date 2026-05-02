import ImageKit from "imagekit";
import appConfig from "../../config/appConfig.js";


/**
 * Initialize ImageKit instance with environment variables.
 */
const imagekit = new ImageKit({
    publicKey: appConfig.publicKey,
    privateKey: appConfig.privateKey,
    urlEndpoint: appConfig.urlEndpoint,
});

/**
 * Uploads a file buffer to ImageKit.
 * @param {Buffer} fileBuffer - The binary content of the file.
 * @param {string} fileName - The name to assign to the file in ImageKit.
 * @param {string} folder - The folder destination in ImageKit.
 * @returns {Promise<Object>} - The upload response from ImageKit.
 */
export const uploadToImageKit = async (fileBuffer, fileName, folder = "/warroom") => {
    try {
        const response = await imagekit.upload({
            file: fileBuffer,
            fileName: fileName,
            folder: folder,
        });
        return response;
    } catch (error) {
        console.error("[ImageKit Service] Upload failed:", error.message);
        throw new Error("Failed to upload file to cloud storage.");
    }
};
