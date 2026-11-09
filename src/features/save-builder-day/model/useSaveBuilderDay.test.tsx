import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";

import { dayPlanApi } from "@/entities/day-plan";
import { baseApi } from "@/shared/api";

import { useSaveBuilderDay } from "./useSaveBuilderDay";

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

class TestRequest {
  url: string;

  constructor(input: string) {
    this.url = input;
  }
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  if (input instanceof TestRequest) {
    return input.url;
  }

  return input.url;
}

describe("useSaveBuilderDay", () => {
  const alertMock = vi.fn();

  beforeEach(() => {
    alertMock.mockReset();
    vi.stubGlobal("alert", alertMock);
    vi.stubGlobal("Request", TestRequest);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("успешный ответ инвалидирует тег DayPlan", async () => {
    const calls: string[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        calls.push(url);

        return jsonResponse({
          date: "2026-11-04",
          athleteId: "ivanov",
          workoutName: "Лёгкий бег",
          plan: { warmUp: "10 минут" },
        });
      }),
    );

    const store = createStore();
    const subscription = store.dispatch(
      dayPlanApi.endpoints.getDayPlan.initiate({
        date: "2026-11-04",
        athleteId: "ivanov",
      }),
    );

    await waitFor(() => {
      expect(calls.some((url) => url.includes("/dayPlan"))).toBe(true);
    });

    const dayPlanCalls = () =>
      calls.filter((url) => url.includes("/dayPlan")).length;
    const before = dayPlanCalls();

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useSaveBuilderDay(), { wrapper });

    await act(async () => {
      await expect(
        result.current.save({
          date: "2026-11-04",
          athleteId: "ivanov",
          workoutName: "Лёгкий бег",
          sections: { warmUp: "10 минут" },
        }),
      ).resolves.toBe(true);
    });

    await waitFor(() => {
      expect(dayPlanCalls()).toBeGreaterThan(before);
    });

    subscription.unsubscribe();
  });

  it("ошибка вызывает alert и не меняет sections", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ message: "Параметр athleteId обязателен" }, 400),
      ),
    );

    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
    const sections = { warmUp: "текст" };
    const workoutName = "Утро";
    const { result } = renderHook(() => useSaveBuilderDay(), { wrapper });

    await act(async () => {
      await expect(
        result.current.save({
          date: "2026-11-04",
          athleteId: "",
          workoutName,
          sections,
        }),
      ).resolves.toBe(false);
    });

    expect(alertMock).toHaveBeenCalledWith("Параметр athleteId обязателен");
    expect(sections).toEqual({ warmUp: "текст" });
    expect(workoutName).toBe("Утро");
  });
});
