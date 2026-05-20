import type { VercelRequest, VercelResponse } from "@vercel/node";
import { askNvidia } from "../src/nvidia.js";
import { sendTelegramMessage, sendTelegramTyping } from "../src/telegram.js";
import { parseAllowedUserIds } from "../src/config.js";
import type { TelegramUpdate } from "../src/types.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "telegram-nvidia-bot" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const actualSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (actualSecret !== webhookSecret) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
  }

  const update = parseUpdate(req.body);
  if (update.business_connection) {
    return res.status(200).json({
      ok: true,
      business_connection: {
        enabled: update.business_connection.is_enabled,
        can_reply: update.business_connection.can_reply
      }
    });
  }

  const message =
    update.business_message ??
    update.edited_business_message ??
    update.message ??
    update.edited_message;
  const businessConnectionId = message?.business_connection_id;
  const chatId = message?.chat?.id;
  const userId = message?.from?.id;
  const text = message?.text?.trim();
  const sendOptions = businessConnectionId ? { businessConnectionId } : undefined;

  if (!chatId || !text) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const allowedUserIds = parseAllowedUserIds(process.env.ALLOWED_TELEGRAM_USER_IDS);
  if (allowedUserIds.size > 0 && (!userId || !allowedUserIds.has(userId))) {
    await sendTelegramMessage(chatId, "Этот бот закрыт для личного использования.", sendOptions);
    return res.status(200).json({ ok: true });
  }

  if (text === "/start" || text === "/help") {
    await sendTelegramMessage(
      chatId,
      businessConnectionId
        ? "Готов. Теперь могу отвечать в Telegram Business чатах."
        : "Привет! Напиши вопрос обычным сообщением, а я отвечу через NVIDIA NIM.",
      sendOptions
    );
    return res.status(200).json({ ok: true });
  }

  await sendTelegramTyping(chatId, sendOptions);

  try {
    const answer = await askNvidia(text);
    await sendTelegramMessage(chatId, answer, sendOptions);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendTelegramMessage(chatId, `Не смог получить ответ от модели: ${message}`, sendOptions);
  }

  return res.status(200).json({ ok: true });
}

function parseUpdate(body: unknown): TelegramUpdate {
  if (typeof body === "string") {
    return JSON.parse(body) as TelegramUpdate;
  }

  if (body && typeof body === "object") {
    return body as TelegramUpdate;
  }

  throw new Error("Invalid Telegram update body");
}
