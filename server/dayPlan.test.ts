import type { Server } from "node:http";

import { app } from "./app";

let server: Server;
let baseUrl = "";

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

async function postPlan(body: unknown) {
  return fetch(`${baseUrl}/api/saveBuilderDay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getPlan(date?: string) {
  const query = date === undefined ? "" : `?date=${encodeURIComponent(date)}`;
  return fetch(`${baseUrl}/api/dayPlan${query}`);
}

describe("dayPlan mock", () => {
  it("сохраняет план и отдаёт его в GET без athleteId", async () => {
    const date = "2026-11-04-save";
    const saved = await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Лёгкий бег",
      sections: { warmUp: "10 минут легко", note: "" },
    });

    expect(saved.status).toBe(200);
    await expect(saved.json()).resolves.toEqual({
      date,
      workoutName: "Лёгкий бег",
      plan: { warmUp: "10 минут легко", note: "" },
    });

    const loaded = await getPlan(date);
    expect(loaded.status).toBe(200);
    await expect(loaded.json()).resolves.toEqual({
      date,
      workoutName: "Лёгкий бег",
      plan: { warmUp: "10 минут легко", note: "" },
    });
  });

  it("повторный POST заменяет план целиком", async () => {
    const date = "2026-11-04-replace";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Первая",
      sections: { warmUp: "первый", main: "останется только если сольётся" },
    });

    const replaced = await postPlan({
      date,
      athleteId: "petrova",
      workoutName: "   ",
      sections: { intervals: "второй" },
    });

    expect(replaced.status).toBe(200);
    await expect(replaced.json()).resolves.toEqual({
      date,
      workoutName: "",
      plan: { intervals: "второй" },
    });

    const loaded = await getPlan(date);
    await expect(loaded.json()).resolves.toEqual({
      date,
      workoutName: "",
      plan: { intervals: "второй" },
    });
  });

  it("неизвестная дата отдаёт пустой план", async () => {
    const date = "2026-11-04-empty";
    const loaded = await getPlan(date);

    expect(loaded.status).toBe(200);
    await expect(loaded.json()).resolves.toEqual({
      date,
      workoutName: "",
      plan: {},
    });
  });

  it("без date возвращает 400 для POST и GET", async () => {
    const posted = await postPlan({ athleteId: "ivanov", sections: {} });
    expect(posted.status).toBe(400);
    await expect(posted.json()).resolves.toEqual({
      message: "Параметр date обязателен",
    });

    const loaded = await getPlan();
    expect(loaded.status).toBe(400);
    await expect(loaded.json()).resolves.toEqual({
      message: "Параметр date обязателен",
    });
  });

  it("POST без athleteId не меняет прежний план", async () => {
    const date = "2026-11-04-athlete";

    await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "Было",
      sections: { warmUp: "было" },
    });

    const rejected = await postPlan({
      date,
      sections: { warmUp: "не должно сохраниться" },
    });

    expect(rejected.status).toBe(400);
    await expect(rejected.json()).resolves.toEqual({
      message: "Параметр athleteId обязателен",
    });

    const loaded = await getPlan(date);
    await expect(loaded.json()).resolves.toEqual({
      date,
      workoutName: "Было",
      plan: { warmUp: "было" },
    });

    const freshDate = "2026-11-04-athlete-empty";
    const freshReject = await postPlan({
      date: freshDate,
      athleteId: "   ",
      sections: { main: "нет" },
    });

    expect(freshReject.status).toBe(400);
    const fresh = await getPlan(freshDate);
    await expect(fresh.json()).resolves.toEqual({
      date: freshDate,
      workoutName: "",
      plan: {},
    });
  });

  it("хранит workoutName отдельно и отбрасывает нестроковые поля", async () => {
    const date = "2026-11-04-fields";
    const saved = await postPlan({
      date,
      athleteId: "ivanov",
      workoutName: "  Утро  ",
      sections: {
        warmUp: "легко",
        extra: "чужой ключ",
        count: 3,
        workoutName: "внутри",
      },
    });

    expect(saved.status).toBe(200);
    await expect(saved.json()).resolves.toEqual({
      date,
      workoutName: "Утро",
      plan: { warmUp: "легко", extra: "чужой ключ" },
    });
  });

  it("без строки workoutName записывает пустое название", async () => {
    const missing = await postPlan({
      date: "2026-11-04-name-missing",
      athleteId: "ivanov",
      sections: { warmUp: "легко" },
    });

    expect(missing.status).toBe(200);
    await expect(missing.json()).resolves.toEqual({
      date: "2026-11-04-name-missing",
      workoutName: "",
      plan: { warmUp: "легко" },
    });

    const notString = await postPlan({
      date: "2026-11-04-name-number",
      athleteId: "ivanov",
      workoutName: 12,
      sections: { note: "заметка" },
    });

    expect(notString.status).toBe(200);
    await expect(notString.json()).resolves.toEqual({
      date: "2026-11-04-name-number",
      workoutName: "",
      plan: { note: "заметка" },
    });
  });
});
