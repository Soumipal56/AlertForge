import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import appConfig from "./appConfig.js";

// Normalize Google profile data into a clean user object
const normalizeGoogleProfile = (profile) => {
    const email = profile.emails && profile.emails.length > 0 
        ? profile.emails[0].value.trim().toLowerCase() 
        : null;
    
    const name = profile.displayName || 
                 (profile.name ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() : null);
    
    const avatar = profile.photos && profile.photos.length > 0 
        ? profile.photos[0].value 
        : null;

    // Generate a unique email if Google doesn't provide one
    const uniqueEmail = email || `google_${profile.id}@auth.google.com`;

    return {
        googleId: profile.id,
        email: uniqueEmail,
        name: name || `User_${profile.id.slice(0, 8)}`,
        avatar: avatar,
    };
};

// Configure Google OAuth 2.0 Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: appConfig.googleClientId,
            clientSecret: appConfig.googleClientSecret,
            callbackURL: appConfig.googleCallbackUrl,
        },
        (accessToken, refreshToken, profile, done) => {
            try {
                const userData = normalizeGoogleProfile(profile);
                // Pass clean user data to the controller via done(null, userData)
                return done(null, userData);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Serialize user (store user data in session - but we're not using sessions)
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user
passport.deserializeUser((user, done) => {
    done(null, user);
});

export default passport;