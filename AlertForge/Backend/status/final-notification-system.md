1. For Email (Fully Automatic)
Yes, you don't have to do anything. Our system automatically grabs your email from Clerk and sends the alerts. You don't need to search for anything.

2. For Telegram and Discord (Automatic after 1-Time Setup)
Your Bot cannot "guess" which Telegram chat or Discord server you want to use. You still have to do a one-time setup:

Telegram: You still need to find your chatId (by messaging the bot once) and save it in your Settings.
Discord: You still need to create a Webhook in your Discord channel and paste the URL in your Settings.

For Telegram and Discord user need to follow these steps:
Telegram - 
Step 1 — Create a Bot

Open Telegram, search @BotFather
Send /newbot
Give it a name → you get a Bot Token

Token: 123456789:ABCDefghIJKLmnopQRSTuvwxyz
Step 2 — Get Your Chat ID

Send any message to your bot
Open this URL in browser:

https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates

Copy the chat.id from the response

Discord -
Open Discord and go to the server where you want the webhook
Click the gear icon ⚙️ next to the channel name (Edit Channel)
Go to Integrations in the left sidebar
Click Webhooks
Click New Webhook (or select an existing one)
Click Copy Webhook URL