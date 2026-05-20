import { loadDotEnv } from "./utils/env.mjs";

loadDotEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.VERCEL_URL || process.env.APP_URL;
const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token) {
  throw new Error("Set TELEGRAM_BOT_TOKEN before running this script.");
}

if (!appUrl) {
  throw new Error("Set APP_URL=https://your-project.vercel.app before running this script.");
}

const normalizedAppUrl = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
const url = `${normalizedAppUrl.replace(/\/$/, "")}/api/telegram`;

const body = {
  url,
  allowed_updates: [
    "message",
    "edited_message",
    "business_connection",
    "business_message",
    "edited_business_message",
    "deleted_business_messages"
  ],
  ...(secretToken ? { secret_token: secretToken } : {})
};

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
});

const data = await response.json();
console.log(JSON.stringify(data, null, 2));

if (!response.ok || !data.ok) {
  process.exitCode = 1;
}
