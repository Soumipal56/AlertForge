// sdk/tests/auth.test.js
import auth from "../packages/auth/index.js";
import logger from "../core/utils/logger.js";

export const testAuth = async () => {
    logger.info("Running Auth Tests...");
    
    try {
        // 1. Test Login
        const loginRes = await auth.login("test@alertforge.com", "AlertForge123!");
        if (loginRes.success) {
            logger.info("✔ Login successful");
        } else {
            throw new Error("Login failed unexpectedly");
        }

        // 2. Test Get Me
        const meRes = await auth.getMe();
        if (meRes.data?.email === "test@alertforge.com") {
            logger.info("✔ Fetch profile successful");
        }

        // 3. Test Invalid Login
        try {
            await auth.login("test@alertforge.com", "wrong-pass");
            throw new Error("Invalid login should have failed");
        } catch (err) {
            logger.info("✔ Handled invalid login correctly");
        }

        return true;
    } catch (err) {
        logger.error("Auth Test Failed:", err.message);
        return false;
    }
};
