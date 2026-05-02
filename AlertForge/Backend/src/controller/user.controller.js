import User from "../model/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../config/constants.js";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import appConfig from "../config/appConfig.js";

// Check if secret key exists
if (!appConfig.CLERK_SECRET_KEY) {
    console.error("[Clerk Debug] CRITICAL: CLERK_SECRET_KEY is missing from appConfig/env!");
}

const clerkClient = createClerkClient({ secretKey: appConfig.CLERK_SECRET_KEY });

/**
 * @description Get notification settings for a user (Auto-syncs email from Clerk)
 */
export const getUserSettings = async (req, res, next) => {
    try {
        const { clerkId } = req.params;
        console.log(`[Clerk Debug] Incoming request for ID: ${clerkId}`);
        
        let settings = await User.findOne({ clerkId });
        
        // Always try to sync if email is missing
        if (!settings || !settings.emailAddress) {
            console.log(`[Clerk Debug] Fetching from Clerk...`);
            try {
                const clerkUser = await clerkClient.users.getUser(clerkId);
                console.log(`[Clerk Debug] Found Clerk User: ${clerkUser.id}`);
                
                // Get all email strings
                const allEmails = (clerkUser.emailAddresses || []).map(e => e.emailAddress);
                console.log(`[Clerk Debug] Emails available in Clerk:`, allEmails);

                // Strategy: 1. Primary Email 2. First Email 3. Null
                let targetEmail = clerkUser.emailAddresses.find(
                    (email) => email.id === clerkUser.primaryEmailAddressId
                )?.emailAddress;

                if (!targetEmail && allEmails.length > 0) {
                    targetEmail = allEmails[0];
                }

                if (targetEmail) {
                    console.log(`[Clerk Debug] Target email identified: ${targetEmail}`);
                    if (!settings) {
                        settings = await User.create({ clerkId, emailAddress: targetEmail });
                    } else {
                        settings.emailAddress = targetEmail;
                        await settings.save();
                    }
                } else {
                    console.warn(`[Clerk Debug] No email address found for this user in Clerk.`);
                }
            } catch (clerkError) {
                console.error("[Clerk Debug] Clerk API Request Failed:", clerkError.message);
                if (!settings) {
                    settings = await User.create({ clerkId });
                }
            }
        }

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Settings fetched and synced", settings));
    } catch (error) {
        console.error("[Clerk Debug] General Error:", error);
        next(error);
    }
};

/**
 * @description Update notification settings for a user
 */
export const updateUserSettings = async (req, res, next) => {
    try {
        const { clerkId } = req.params;
        const updates = req.body;

        const settings = await User.findOneAndUpdate(
            { clerkId },
            { $set: updates },
            { new: true, upsert: true }
        );

        return res.json(new ApiResponse(HTTP_STATUS.OK, "Settings updated successfully", settings));
    } catch (error) {
        next(error);
    }
};
