# NVIDIA NIM Telegram Bot

Telegram-бот для Vercel. Он принимает сообщения через webhook, отправляет вопрос в NVIDIA NIM Chat Completions API и возвращает ответ в Telegram.

## Что нужно

- Telegram bot token от [@BotFather](https://t.me/BotFather)
- NVIDIA NIM API key
- Vercel account

## Локальная настройка

```bash
npm install
cp .env.example .env
```

Заполни `.env`:

```env
TELEGRAM_BOT_TOKEN=...
NVIDIA_NIM_API_KEY=...
TELEGRAM_WEBHOOK_SECRET=любой_длинный_секрет
ALLOWED_TELEGRAM_USER_IDS=123456789
```

`ALLOWED_TELEGRAM_USER_IDS` лучше заполнить своим Telegram user ID, чтобы бот отвечал только тебе. Узнать ID можно, например, через [@userinfobot](https://t.me/userinfobot).

## Деплой на Vercel

1. Залей проект на GitHub.
2. Импортируй репозиторий в Vercel.
3. В Vercel открой Project Settings -> Environment Variables.
4. Добавь:
   - `TELEGRAM_BOT_TOKEN`
   - `NVIDIA_NIM_API_KEY`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `ALLOWED_TELEGRAM_USER_IDS`
   - `NVIDIA_MODEL`
5. Нажми Deploy.

После деплоя пропиши webhook:

```bash
APP_URL=https://your-project.vercel.app npm run set-webhook
```

На Windows PowerShell:

```powershell
$env:APP_URL="https://your-project.vercel.app"
$env:TELEGRAM_BOT_TOKEN="..."
$env:TELEGRAM_WEBHOOK_SECRET="..."
npm run set-webhook
```

## Проверка

Открой:

```text
https://your-project.vercel.app/api/telegram
```

Если видишь JSON с `ok: true`, endpoint живой.

## Важно про ключи

Не коммить `.env`. Если API key уже отправлялся в чат или публичное место, лучше перевыпустить его в NVIDIA и заменить в Vercel.
