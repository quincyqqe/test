import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import handler from "../api/telegram.js";

const port = Number(process.env.PORT || 3000);
const publicDir = join(process.cwd(), "public");

loadDotEnv();

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

createServer(async (request, response) => {
  try {
    if (request.url?.startsWith("/api/telegram")) {
      await handleApi(request, response);
      return;
    }

    handleStatic(request, response);
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: false, error: "Internal server error" }));
  }
}).listen(port, () => {
  console.log(`Local bot server: http://localhost:${port}`);
  console.log(`Telegram endpoint: http://localhost:${port}/api/telegram`);
});

async function handleApi(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readRequestBody(request);
  const req = {
    method: request.method,
    headers: request.headers,
    body
  };

  const res = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      response.writeHead(this.statusCode, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify(payload));
      return this;
    },
    send(payload: unknown) {
      response.writeHead(this.statusCode);
      response.end(String(payload));
      return this;
    }
  };

  await handler(req as never, res as never);
}

function handleStatic(request: IncomingMessage, response: ServerResponse): void {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = normalize(join(publicDir, pathname));

  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = readFileSync(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream"
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

async function readRequestBody(request: IncomingMessage): Promise<unknown> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    return undefined;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

function loadDotEnv(): void {
  try {
    const env = readFileSync(join(process.cwd(), ".env"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const index = trimmed.indexOf("=");
      if (index === -1) {
        continue;
      }

      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional for health checks and static page testing.
  }
}
