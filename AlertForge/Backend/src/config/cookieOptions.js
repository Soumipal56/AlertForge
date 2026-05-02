const isProduction = process.env.NODE_ENV === "production";

export const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
};

export const accessTokenCookieOptions = {
    ...authCookieOptions,
    maxAge: 15 * 60 * 1000,
};

export const refreshTokenCookieOptions = {
    ...authCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
};
