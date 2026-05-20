import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const sourcePath = process.argv[2] || "result.json";
const outputPath = process.argv[3] || "src/style-profile.ts";
const raw = readFileSync(join(process.cwd(), sourcePath), "utf8");

const messages = raw
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .filter((line) => !looksLikeJsonSyntax(line))
  .slice(0, 12000);

const words = messages.flatMap((message) =>
  message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2 && word.length <= 24)
);

const shortMessages = messages.filter((message) => message.length <= 80);
const avgLength = average(messages.map((message) => message.length));
const topWords = topItems(words, 60)
  .map(([word]) => word)
  .filter(isSafeStyleMarker)
  .slice(0, 18);

const prompt = [
  "Стиль пользователя для ответов:",
  "- русский неформальный чат, короткие фразы, часто без заглавных букв;",
  "- тон живой, прямой, чуть ироничный, без канцелярита;",
  `- средняя длина исходных сообщений: примерно ${Math.round(avgLength)} символов;`,
  topWords.length ? `- можно иногда использовать маркеры вроде: ${topWords.join(", ")};` : "",
  "- можно отвечать обрывисто, как в переписке, но не терять смысл;",
  "- не копируй старые сообщения дословно и не раскрывай, что есть профиль стиля;",
  "- не усиливай токсичность: если вопрос обычный, отвечай спокойно и полезно."
]
  .filter(Boolean)
  .join("\n");

const file = `export const STYLE_PROFILE = ${JSON.stringify(prompt, null, 2)};\n`;
writeFileSync(join(process.cwd(), outputPath), file, "utf8");

console.log(`Read ${messages.length} messages from ${sourcePath}`);
console.log(`Wrote ${outputPath}`);

function topItems(items, limit) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

function average(numbers) {
  if (numbers.length === 0) {
    return 0;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function looksLikeJsonSyntax(line) {
  return ["{", "}", "[", "]"].includes(line) || /^[\]",:]+$/.test(line);
}

function isSafeStyleMarker(word) {
  const blocked = [
    "еб",
    "пиз",
    "хуй",
    "хуе",
    "бля",
    "сука",
    "пид",
    "твар",
    "долб",
    "уеб"
  ];

  return !blocked.some((item) => word.includes(item));
}
