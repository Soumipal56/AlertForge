# Notification System Setup Guide

This guide explains how to set up Discord and Telegram notifications for your AlertForge account.

---

## 🔹 DISCORD SETUP

1.  **Open Discord**: Go to the server where you want to receive alerts.
2.  **Server Settings**: Click on the server name and select `Server Settings`.
3.  **Integrations**: Go to `Integrations` -> `Webhooks`.
4.  **Create Webhook**: Click `New Webhook`.
5.  **Copy URL**: Give it a name, select a channel, and click `Copy Webhook URL`.
6.  **Update Profile**: Go to your AlertForge profile and paste the URL in the **Discord Webhook URL** field. Enable **Discord Notifications** in settings.

---

## 🔹 TELEGRAM SETUP

1.  **Open Telegram**: Search for [@BotFather](https://t.me/botfather).
2.  **Create Bot**: Use the `/newbot` command and follow instructions to get your **API Token**.
3.  **Set Environment Variable**: Add your token to the backend `.env` file:
    ```env
    TELEGRAM_BOT_TOKEN=your_token_here
    ```
4.  **Find Chat ID**:
    *   Send a message to your new bot.
    *   Open this URL in your browser (replace `<YOUR_TOKEN>`):
        `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
    *   Look for `"chat":{"id":123456789}` in the JSON response.
5.  **Update Profile**: Paste the `id` number into the **Telegram Chat ID** field in your AlertForge profile. Enable **Telegram Notifications**.

---

## 🔹 EMAIL FLOW

*   **Primary Email**: Sent to the email address used during registration (`user.email`).
*   **Team Emails**: You can add multiple emails in the **Team Emails** field (comma-separated or array in JSON). Notifications will be sent to all of them in parallel.

---

## 🔹 HOW NOTIFICATIONS WORK

1.  An **Incident** is created via the API or a Webhook.
2.  The system identifies the user associated with the **API Key**.
3.  The system checks the user's **Notification Settings**.
4.  Alerts are dispatched simultaneously to:
    *   All verified **Emails**.
    *   The configured **Discord Webhook**.
    *   The configured **Telegram Chat**.
5.  Each alert includes a direct link to the **War Room** for immediate response.

---

## 🔹 FUTURE IMPROVEMENTS

*   **Rate Limiting**: Prevent notification storms during flapping services.
*   **Escalation system**: Notify managers if an incident isn't acknowledged.
*   **Retry mechanism**: Automatic retries for failed webhook deliveries.
*   **Queue system**: Moving notification dispatch to BullMQ for better scalability.
