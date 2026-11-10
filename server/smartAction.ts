import type { Request, Response } from "express";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_TEMPERATURE = 0.3;

const SYSTEM_PROMPT = `Ты правишь один тренировочный день. Верни только JSON, без markdown и без пояснений.
Форма ответа: {"workoutName": string, "plan": Record<string, string>}.
plan — блоки дня. Ключи: warmUp, main, intervals, stretch, strength, coolDown, note. workoutName в plan не входит. Пустая строка блока допустима.
Сохраняй стиль и терминологию исходного плана.
Поля плана, которых действие не касается, оставь без изменений, включая уже сохранённый неизвестный ключ.
Не добавляй date, athleteId, другие даты и неделю.`;

export type SmartActionDay = {
  workoutName: string;
  plan: Record<string, string>;
};

export type SmartActionMessages = {
  system: string;
  user: string;
};

export type SmartActionChunkSource = (
  messages: SmartActionMessages,
  signal: AbortSignal,
) => AsyncIterable<string>;

export type SmartActionInput = {
  date: string;
  athleteId: string;
  action: unknown;
  day: SmartActionDay;
};

let chunkSource: SmartActionChunkSource | null = null;

export function setSmartActionChunkSource(source: SmartActionChunkSource | null) {
  chunkSource = source;
}

function readAction(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const action = value.trim();
  return action.length > 0 ? action : null;
}

function buildMessages(day: SmartActionDay, action: string): SmartActionMessages {
  return {
    system: SYSTEM_PROMPT,
    user: `Текущий день:\n${JSON.stringify({ workoutName: day.workoutName, plan: day.plan })}\n\nДействие тренера:\n${action}`,
  };
}

function beginStream(res: Response) {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

function writeText(res: Response, text: string) {
  res.write(`data: ${JSON.stringify({ text })}\n\n`);
}

async function* readGroqContent(
  stream: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed.startsWith("data:")) {
          continue;
        }

        const data = trimmed.slice("data:".length).trim();

        if (data === "[DONE]") {
          return;
        }

        const payload = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: unknown } }>;
        };
        const content = payload.choices?.[0]?.delta?.content;

        if (typeof content === "string" && content.length > 0) {
          yield content;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function* groqChunkSource(
  messages: SmartActionMessages,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("LLM не настроен");
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: GROQ_TEMPERATURE,
      stream: true,
      messages: [
        { role: "system", content: messages.system },
        { role: "user", content: messages.user },
      ],
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error("LLM недоступна");
  }

  yield* readGroqContent(response.body, signal);
}

function failBeforeStream(res: Response, message: string) {
  res.status(500).json({ message });
}

export async function handleSmartAction(
  req: Request,
  res: Response,
  input: SmartActionInput,
): Promise<void> {
  const action = readAction(input.action);

  if (!action) {
    res.status(400).json({ message: "Параметр action обязателен" });
    return;
  }

  const source = chunkSource ?? groqChunkSource;

  if (!chunkSource && !process.env.GROQ_API_KEY?.trim()) {
    failBeforeStream(res, "LLM не настроен");
    return;
  }

  const messages = buildMessages(input.day, action);
  const abort = new AbortController();
  const stop = () => {
    if (!res.writableEnded) {
      abort.abort();
    }
  };

  res.on("close", stop);

  const iterator = source(messages, abort.signal)[Symbol.asyncIterator]();
  let started = false;

  try {
    while (!abort.signal.aborted) {
      const step = await iterator.next();

      if (abort.signal.aborted) {
        return;
      }

      if (step.done) {
        break;
      }

      if (step.value.length === 0) {
        continue;
      }

      if (!started) {
        beginStream(res);
        started = true;
      }

      writeText(res, step.value);
    }

    if (abort.signal.aborted) {
      return;
    }

    if (!started) {
      beginStream(res);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch {
    if (abort.signal.aborted || res.writableEnded) {
      return;
    }

    if (!started) {
      failBeforeStream(res, "LLM недоступна");
      return;
    }

    res.write(`data: ${JSON.stringify({ error: "LLM недоступна" })}\n\n`);
    res.end();
  } finally {
    res.off("close", stop);
    await iterator.return?.();
  }
}
