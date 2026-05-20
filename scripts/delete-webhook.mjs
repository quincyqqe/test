import { loadDotEnv } from "./utils/env.mjs";

loadDotEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("Set TELEGRAM_BOT_TOKEN in .env before running this script.");
}

const response = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
const data = await response.json();

console.log(JSON.stringify(data, null, 2));

if (!response.ok || !data.ok) {
  process.exitCode = 1;
}
