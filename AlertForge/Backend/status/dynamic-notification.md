I have completed the full backend implementation for dynamic notifications. Everything is now structured so that notifications are sent based on individual user settings stored in the database, rather than using static environment variables.

### Done in the Backend:

1.  *Dynamic Notification Core*:
    *   *User.model.js*: Created a schema to store clerkId, telegramChatId, discordWebhookUrl, whatsappNumber, and emailAddress, along with toggle switches (preferences) for each.
    *   *notification.service.js*: Re-engineered to fetch the user's settings from the DB and only send alerts to their enabled channels with their specific IDs/URLs.
2.  *Channel Services Updated*:
    *   *telegram.service.js*: Now accepts a dynamic chatId.
    *   *webhook.service.js*: Now accepts a dynamic webhookUrl.
    *   *whatsapp.service.js*: Now accepts a dynamic whatsappNumber.
3.  *Ownership Logic*:
    *   *ApiKey.model.js*: Added a clerkId field so the system knows which user to notify when a specific API Key triggers an incident.
    *   *apikey.controller.js*: Updated to require a clerkId when creating new API keys.
    *   *incident.controller.js*: Now automatically looks up the owner of the API key and sends personalized notifications to them.
4.  *User Management API*:
    *   *user.controller.js & user.routes.js*: Created endpoints for your frontend to manage these settings:
        *   GET /api/users/:clerkId/settings: Retrieve current notification setup.
        *   PATCH /api/users/:clerkId/settings: Update preferences or channel details.

### How it works now:
When an incident is created via an API key:
1.  The backend finds the clerkId associated with that API key.
2.  It fetches the UserNotificationSettings for that clerkId.
3.  It checks the user's preferences (e.g., is Telegram enabled?).
4.  It sends the alert directly to the user's saved telegramChatId or discordWebhookUrl.