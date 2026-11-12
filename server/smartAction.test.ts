import type { Server } from "node:http";
import { request as httpRequest } from "node:http";

import { app } from "./app";
import { setSmartActionChunkSource, type SmartActionMessages } from "./smartAction";

let server: Server;
let baseUrl = "";
const originalKey = process.env.GROQ_API_KEY;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Сервер не получил порт");
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

afterEach(() => {
  setSmartActionChunkSource(null);
  vi.unstubAllGlobals();

  if (originalKey === undefined) {
    delete process.env.GROQ_API_KEY;
  } else {
    process.env.GROQ_API_KEY = originalKey;
  }
});

function postJson(path: string, body: unknown) {
  const payload = JSON.stringify(body);

  return new Promise<{ status: number; headers: Record<string, string | string[] | undefined>; text: string }>(
    (resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = httpRequest(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            resolve({
              status: res.statusCode ?? 0,
              headers: res.headers,
              text: Buffer.concat(chunks).toString("utf8"),
            });
          });
        },
      );

      req.on("error", reject);
      req.end(payload);
    },
  );
}

async function postPlan(body: unknown) {
  return fetch(`${baseUrl}/api/saveBuilderDay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getPlan(date: string, athleteId: string) {
  const params = new URLSearchParams({ date, athleteId });
  return fetch(`${baseUrl}/api/dayPlan?${params.toString()}`);
}

function header(headers: Record<string, string | string[] | undefined>, name: string) {
  const value = headers[name];
  return Array.isArray(value) ? value.join(", ") : value;
}

describe("smartAction", () => {
  it("стримит куски модели и завершает поток [DONE]", async () => {
    const date = "2026-11-04-smart-stream";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Лёгкий бег",
      plan: { warmUp: "10 минут легко", main: "40 минут ровно", extra: "чужой ключ" },
    });

    let seen: SmartActionMessages | null = null;
    setSmartActionChunkSource(async function* (messages) {
      seen = messages;
      yield "{";
      yield "";
      yield '"workoutName":"Восстановительный бег"';
      yield "```json";
    });

    const response = await postJson(`${baseUrl}/api/smartAction`, {
      date,
      athleteId: "  ivanov  ",
      action: "Сделай этот день легче",
    });

    expect(response.status).toBe(200);
    expect(header(response.headers, "content-type")).toContain("text/event-stream");
    expect(header(response.headers, "cache-control")).toBe("no-cache");
    expect(header(response.headers, "connection")).toBe("keep-alive");
    expect(response.text).toBe(
      'data: {"text":"{"}\n\n' +
        'data: {"text":"\\"workoutName\\":\\"Восстановительный бег\\""}\n\n' +
        'data: {"text":"```json"}\n\n' +
        "data: [DONE]\n\n",
    );
    expect(seen?.system).toContain("Верни только JSON, без markdown");
    expect(seen?.system).toContain("warmUp, main, intervals, stretch, strength, coolDown, note");
    expect(seen?.system).toContain("workoutName в plan не входит");
    expect(seen?.system).toContain("Сохраняй стиль и терминологию исходного плана.");
    expect(seen?.system).toContain("Поля плана, которых действие не касается, оставь без изменений");
    expect(seen?.user).toBe(
      'Текущий день:\n{"workoutName":"Лёгкий бег","plan":{"warmUp":"10 минут легко","main":"40 минут ровно","extra":"чужой ключ"}}\n\nДействие тренера:\nСделай этот день легче',
    );

    const loaded = await getPlan(date, "ivanov");
    await expect(loaded.json()).resolves.toEqual({
      date,
      athleteId: "ivanov",
      workoutName: "Лёгкий бег",
      plan: { warmUp: "10 минут легко", main: "40 минут ровно", extra: "чужой ключ" },
    });

    const other = await getPlan(date, "petrova");
    await expect(other.json()).resolves.toEqual({
      date,
      athleteId: "petrova",
      workoutName: "",
      plan: {},
    });
  });

  it("просит Groq модель openai/gpt-oss-120b с temperature 0.3 и пересылает только content", async () => {
    const date = "2026-11-04-smart-groq";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Лёгкий бег",
      plan: { main: "40 минут ровно" },
    });

    process.env.GROQ_API_KEY = "test-key";
    const calls: Array<{ url: string; init: RequestInit }> = [];

    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode('data: {"choices":[{"delta":{"content":"{"}}]}\n\n'),
          );
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n'));
          controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":""}}]}\n\n'));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });

      return new Response(stream, { status: 200 });
    });

    const response = await postJson(`${baseUrl}/api/smartAction`, {
      date,
      athleteId: "ivanov",
      action: "Сделай этот день легче",
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe('data: {"text":"{"}\n\ndata: [DONE]\n\n');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(calls[0].init.headers).toMatchObject({
      Authorization: "Bearer test-key",
    });

    const body = JSON.parse(String(calls[0].init.body));
    expect(body.model).toBe("openai/gpt-oss-120b");
    expect(body.temperature).toBe(0.3);
    expect(body.stream).toBe(true);
    expect(body.messages[1].content).toContain('"workoutName":"Лёгкий бег"');
    expect(body.messages[1].content).toContain("Сделай этот день легче");
  });

  it("отклоняет пустые и нестроковые поля в порядке date, athleteId, action", async () => {
    const date = "2026-11-04-smart-invalid";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Было",
      plan: { warmUp: "было" },
    });

    const cases = [
      [{ athleteId: "ivanov", action: "легче" }, "Параметр date обязателен"],
      [{ date: 12, athleteId: "ivanov", action: "легче" }, "Параметр date обязателен"],
      [{ date: "   ", athleteId: "ivanov", action: "легче" }, "Параметр date обязателен"],
      [{ action: "легче" }, "Параметр date обязателен"],
      [{ date, action: "легче" }, "Параметр athleteId обязателен"],
      [{ date, athleteId: "   ", action: "легче" }, "Параметр athleteId обязателен"],
      [{ date, athleteId: 7, action: "легче" }, "Параметр athleteId обязателен"],
      [{ date, athleteId: "ivanov" }, "Параметр action обязателен"],
      [{ date, athleteId: "ivanov", action: "   " }, "Параметр action обязателен"],
      [{ date, athleteId: "ivanov", action: 12 }, "Параметр action обязателен"],
    ] as const;

    for (const [body, message] of cases) {
      const response = await postJson(`${baseUrl}/api/smartAction`, body);

      expect(response.status).toBe(400);
      expect(header(response.headers, "content-type")).toContain("application/json");
      expect(response.text).toBe(JSON.stringify({ message }));
      expect(response.text).not.toContain("data:");
    }

    const loaded = await getPlan(date, "ivanov");
    await expect(loaded.json()).resolves.toEqual({
      date,
      athleteId: "ivanov",
      workoutName: "Было",
      plan: { warmUp: "было" },
    });
  });

  it("отдаёт 404, если пары нет, и открывает поток для сохранённого пустого плана", async () => {
    const missingDate = "2026-11-04-smart-missing";
    const emptyDate = "2026-11-04-smart-empty";

    const missing = await postJson(`${baseUrl}/api/smartAction`, {
      date: missingDate,
      athleteId: "ivanov",
      action: "Сделай этот день легче",
    });

    expect(missing.status).toBe(404);
    expect(header(missing.headers, "content-type")).toContain("application/json");
    expect(missing.text).toBe(JSON.stringify({ message: "План на эту дату не найден" }));

    const loaded = await getPlan(missingDate, "ivanov");
    await expect(loaded.json()).resolves.toEqual({
      date: missingDate,
      athleteId: "ivanov",
      workoutName: "",
      plan: {},
    });

    await postPlan({
      date: emptyDate,
      athleteId: "ivanov",
      workoutName: "",
      plan: {},
    });

    setSmartActionChunkSource(async function* (messages) {
      expect(messages.user).toContain('{"workoutName":"","plan":{}}');
      yield "пусто";
    });

    const empty = await postJson(`${baseUrl}/api/smartAction`, {
      date: emptyDate,
      athleteId: "ivanov",
      action: "Сделай этот день легче",
    });

    expect(empty.status).toBe(200);
    expect(empty.text).toBe('data: {"text":"пусто"}\n\ndata: [DONE]\n\n');
  });

  it("без ключа и без подставной модели отвечает 500", async () => {
    const date = "2026-11-04-smart-key";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Бег",
      plan: { main: "ровно" },
    });

    delete process.env.GROQ_API_KEY;

    const response = await postJson(`${baseUrl}/api/smartAction`, {
      date,
      athleteId: "ivanov",
      action: "легче",
    });

    expect(response.status).toBe(500);
    expect(header(response.headers, "content-type")).toContain("application/json");
    expect(response.text).toBe(JSON.stringify({ message: "LLM не настроен" }));
  });

  it("ошибка источника до заголовков отвечает 500", async () => {
    const date = "2026-11-04-smart-down";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Бег",
      plan: { main: "ровно" },
    });

    setSmartActionChunkSource(async function* () {
      throw new Error("down");
    });

    const response = await postJson(`${baseUrl}/api/smartAction`, {
      date,
      athleteId: "ivanov",
      action: "легче",
    });

    expect(response.status).toBe(500);
    expect(response.text).toBe(JSON.stringify({ message: "LLM недоступна" }));
  });

  it("ошибка Groq до потока отвечает 500", async () => {
    const date = "2026-11-04-smart-groq-down";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Бег",
      plan: { main: "ровно" },
    });

    process.env.GROQ_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      async () => new Response("fail", { status: 503 }),
    );

    const response = await postJson(`${baseUrl}/api/smartAction`, {
      date,
      athleteId: "ivanov",
      action: "легче",
    });

    expect(response.status).toBe(500);
    expect(response.text).toBe(JSON.stringify({ message: "LLM недоступна" }));
  });

  it("ошибка после первого куска пишет error и не пишет [DONE]", async () => {
    const date = "2026-11-04-smart-mid";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Бег",
      plan: { main: "ровно" },
    });

    setSmartActionChunkSource(async function* () {
      yield "начало";
      throw new Error("down");
    });

    const response = await postJson(`${baseUrl}/api/smartAction`, {
      date,
      athleteId: "ivanov",
      action: "легче",
    });

    expect(response.status).toBe(200);
    expect(response.text).toBe(
      'data: {"text":"начало"}\n\ndata: {"error":"LLM недоступна"}\n\n',
    );
    expect(response.text).not.toContain("[DONE]");

    const loaded = await getPlan(date, "ivanov");
    await expect(loaded.json()).resolves.toEqual({
      date,
      athleteId: "ivanov",
      workoutName: "Бег",
      plan: { main: "ровно" },
    });
  });

  it("закрытие клиента прерывает чтение модели и не меняет план", async () => {
    const date = "2026-11-04-smart-abort";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Бег",
      plan: { main: "ровно" },
    });

    let release: (() => void) | null = null;
    const sawAbort = new Promise<void>((resolve) => {
      release = resolve;
    });

    setSmartActionChunkSource(async function* (_messages, signal) {
      yield "кусок";
      await new Promise<void>((resolve) => {
        if (signal.aborted) {
          resolve();
          return;
        }

        signal.addEventListener("abort", () => resolve(), { once: true });
      });
      release?.();
    });

    const payload = JSON.stringify({
      date,
      athleteId: "ivanov",
      action: "легче",
    });

    await new Promise<void>((resolve, reject) => {
      const url = new URL("/api/smartAction", baseUrl);
      const req = httpRequest(
        {
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          res.on("data", () => {
            req.destroy();
          });
          res.on("error", () => resolve());
          res.on("close", () => resolve());
        },
      );

      req.on("error", (error: NodeJS.ErrnoException) => {
        if (error.code === "ECONNRESET") {
          resolve();
          return;
        }

        reject(error);
      });
      req.end(payload);
    });

    await sawAbort;

    const loaded = await getPlan(date, "ivanov");
    await expect(loaded.json()).resolves.toEqual({
      date,
      athleteId: "ivanov",
      workoutName: "Бег",
      plan: { main: "ровно" },
    });
  });
});
