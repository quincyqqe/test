import { getEnv } from "./config.js";

type TelegramResponse = {
  ok: boolean;
  description?: string;
};

const MAX_TELEGRAM_MESSAGE_LENGTH = 4096;

export async function sendTelegramTyping(chatId: number): Promise<void> {
  await telegramRequest("sendChatAction", {
    chat_id: chatId,
    action: "typing"
  });
}

export async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  const chunks = splitMessage(text);
  for (const chunk of chunks) {
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: chunk,
      disable_web_page_preview: true
    });
  }
}

async function telegramRequest(method: string, payload: Record<string, unknown>): Promise<void> {
  const token = getEnv("TELEGRAM_BOT_TOKEN");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json().catch(() => ({}))) as TelegramResponse;
  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API error ${response.status}`);
  }
}

function splitMessage(text: string): string[] {
  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += MAX_TELEGRAM_MESSAGE_LENGTH) {
    chunks.push(text.slice(start, start + MAX_TELEGRAM_MESSAGE_LENGTH));
  }

  return chunks.length > 0 ? chunks : [" "];
}
