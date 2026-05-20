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

const DEFAULT_MODEL = "z-ai/glm5.1";
const DEFAULT_FALLBACK_MODELS = [
  "z-ai/glm4.7",
  "nvidia/nvidia-nemotron-nano-9b-v2",
  "nvidia/llama-3.1-nemotron-nano-8b-v1"
];
const DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1";

export async function askNvidia(question: string): Promise<string> {
  const apiKey = getEnv("NVIDIA_NIM_API_KEY");
  const models = getCandidateModels();
  const baseUrl = process.env.NVIDIA_BASE_URL || DEFAULT_BASE_URL;
  const errors: string[] = [];

  for (const model of models) {
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
      errors.push(`${model}: ${data.error?.message || `NVIDIA API error ${response.status}`}`);
      continue;
    }

    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      errors.push(`${model}: NVIDIA API returned an empty answer`);
      continue;
    }

    return answer;
  }

  throw new Error(`All NVIDIA models failed. ${errors.join(" | ")}`);
}

function getCandidateModels(): string[] {
  const preferred = process.env.NVIDIA_MODEL || DEFAULT_MODEL;
  const fallbacks = process.env.NVIDIA_FALLBACK_MODELS
    ? process.env.NVIDIA_FALLBACK_MODELS.split(",")
    : DEFAULT_FALLBACK_MODELS;

  const models = [preferred, ...fallbacks].map(normalizeModelName);
  return [...new Set(models.filter(Boolean))];
}

function normalizeModelName(model: string): string {
  return model.trim().replace(/^nvidia_nim\//, "");
}
