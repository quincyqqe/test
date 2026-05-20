import { getEnv } from "./config.js";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_MODEL = "nvidia/llama-3.1-nemotron-70b-instruct";
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";

export async function askNvidia(question: string): Promise<string> {
  const apiKey = getEnv("NVIDIA_NIM_API_KEY");
  const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;
  const baseUrl = process.env.NVIDIA_BASE_URL || DEFAULT_BASE_URL;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "Ты полезный Telegram-ассистент. Отвечай по-русски, кратко и понятно, если пользователь не попросил иначе."
        },
        {
          role: "user",
          content: question
        }
      ]
    })
  });

  const data = (await response.json().catch(() => ({}))) as ChatCompletionResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || `NVIDIA API error ${response.status}`);
  }

  const answer = data.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("NVIDIA API returned an empty answer");
  }

  return answer;
}
