import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";

import { baseApi } from "@/shared/api";

import { useSmartDayAction } from "./useSmartDayAction";

const seen = vi.hoisted(() => [] as string[]);

vi.mock("@/entities/day-plan/api/smartActionProgress", async () => {
  const actual = await vi.importActual<
    typeof import("@/entities/day-plan/api/smartActionProgress")
  >("@/entities/day-plan/api/smartActionProgress");

  return {
    ...actual,
    notifySmartActionProgress: (text: string) => {
      seen.push(text);
      actual.notifySmartActionProgress(text);
    },
  };
});

function createStore() {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sseResponse(events: string[]) {
  const payload = events.map((event) => `data: ${event}\n\n`).join("");
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(payload));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("useSmartDayAction", () => {
  const alertMock = vi.fn();

  beforeEach(() => {
    seen.length = 0;
    alertMock.mockReset();
    vi.stubGlobal("alert", alertMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("собирает куски по порядку и возвращает разобранный объект", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        date: "2026-11-04",
        athleteId: "ivanov",
        action: "Сделай этот день легче",
      });

      return sseResponse([
        JSON.stringify({ text: '{"workoutName":"Бег"' }),
        JSON.stringify({ text: ',"plan":{"main":"40"}}' }),
        "[DONE]",
      ]);
    });

    vi.stubGlobal("fetch", fetchMock);

    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useSmartDayAction(), { wrapper });

    let parsed: unknown;

    await act(async () => {
      parsed = await result.current.run({
        date: "2026-11-04",
        athleteId: "ivanov",
        action: "Сделай этот день легче",
      });
    });

    expect(seen).toEqual([
      '{"workoutName":"Бег"',
      '{"workoutName":"Бег","plan":{"main":"40"}}',
    ]);
    expect(parsed).toEqual({
      workoutName: "Бег",
      plan: { main: "40" },
    });
    expect(alertMock).not.toHaveBeenCalled();
  });

  it("на 404 показывает сообщение и не возвращает план", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ message: "План на эту дату не найден" }, 404),
      ),
    );

    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useSmartDayAction(), { wrapper });

    await act(async () => {
      await expect(
        result.current.run({
          date: "2026-11-04",
          athleteId: "ivanov",
          action: "Сделай этот день легче",
        }),
      ).resolves.toBeNull();
    });

    expect(alertMock).toHaveBeenCalledWith("План на эту дату не найден");
    expect(seen).toEqual([]);
  });

  it("ошибка потока показывает текст error и не возвращает объект", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseResponse([
          JSON.stringify({ text: '{"workoutName":"Бег"' }),
          JSON.stringify({ error: "LLM недоступна" }),
        ]),
      ),
    );

    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useSmartDayAction(), { wrapper });

    await act(async () => {
      await expect(
        result.current.run({
          date: "2026-11-04",
          athleteId: "ivanov",
          action: "Сделай этот день легче",
        }),
      ).resolves.toBeNull();
    });

    expect(alertMock).toHaveBeenCalledWith("LLM недоступна");
  });

  it("повторный запуск во время первого не шлёт второй fetch", async () => {
    let release: ((chunk: string | null) => void) | undefined;
    const encoder = new TextEncoder();
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          const stream = new ReadableStream<Uint8Array>({
            start(controller) {
              release = (chunk) => {
                if (chunk === null) {
                  controller.close();
                  return;
                }

                controller.enqueue(encoder.encode(chunk));
              };
            },
          });

          resolve(
            new Response(stream, {
              status: 200,
              headers: { "Content-Type": "text/event-stream" },
            }),
          );
        }),
    );

    vi.stubGlobal("fetch", fetchMock);

    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useSmartDayAction(), { wrapper });
    const body = {
      date: "2026-11-04",
      athleteId: "ivanov",
      action: "Сделай этот день легче",
    };

    let first: Promise<unknown> = Promise.resolve(null);
    let second: Promise<unknown> = Promise.resolve(null);

    await act(async () => {
      first = result.current.run(body);
      second = result.current.run(body);
      await expect(second).resolves.toBeNull();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      release?.(
        `data: ${JSON.stringify({ text: '{"workoutName":"Бег","plan":{}}' })}\n\n`,
      );
      release?.("data: [DONE]\n\n");
      release?.(null);
      await first;
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
