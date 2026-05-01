import dotenv from "dotenv";

dotenv.config();
/**  
 * @type {Object} appConfig - Configuration object for the application
 * @description Configuration object for the application
 * @property {number} port - Port number to listen on
 * @property {string} mongoURI - MongoDB connection string
 * @property {string} nodeEnv - Node environment
 */
const appConfig = {
    port: process.env.PORT || 3000,
    mongoURI: process.env.MONGO_URI,
    nodeEnv: process.env.NODE_ENV || "development",
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    TWILIO_SID: process.env.TWILIO_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
};

export default appConfig;