import appConfig from "./appConfig.js";

const isProduction = appConfig.nodeEnv === "production" || process.env.RENDER === "true" || !!process.env.RENDER;

// On localhost, we need sameSite: 'none' and secure: true to allow cookies across ports (5173 -> 3000)
// Chrome allows 'secure' on localhost without HTTPS.
export const authCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};

export const accessTokenCookieOptions = {
    ...authCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
