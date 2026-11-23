import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook } from "@testing-library/react";

import { baseApi } from "@/shared/api";

import { useCopyWeek } from "./useCopyWeek";
import { emptyWeekDraft, type WeekDayDraft } from "./weekDraft";

const dates = [
  "2026-11-02",
  "2026-11-03",
  "2026-11-04",
  "2026-11-05",
  "2026-11-06",
  "2026-11-07",
  "2026-11-08",
];

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

function dayBody(
  date: string,
  plan: Record<string, string> = {},
  workoutName = "",
) {
  return {
    date,
    athleteId: "ivanov",
    workoutName,
    plan,
  };
}

class TestRequest {
  url: string;

  constructor(input: string) {
    this.url = input;
  }
}

describe("useCopyWeek", () => {
  const alertMock = vi.fn();

  beforeEach(() => {
    alertMock.mockReset();
    vi.stubGlobal("alert", alertMock);
    vi.stubGlobal("Request", TestRequest);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(requestUrl(input), "http://localhost");
        const date = url.searchParams.get("date") ?? "";

        return jsonResponse(dayBody(date));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderCopy(
    drafts: Map<string, WeekDayDraft>,
    athleteId = "ivanov",
    week = dates,
  ) {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    return renderHook(
      ({ id, nextDates }) =>
        useCopyWeek({
          athleteId: id,
          dates: nextDates,
          draftAt: (date) => drafts.get(date) ?? null,
        }),
      {
        wrapper,
        initialProps: { id: athleteId, nextDates: week },
      },
    );
  }

  it("кладёт семь черновиков в буфер по порядку дней без athleteId", async () => {
    const drafts = new Map<string, WeekDayDraft>(
      dates.map((date, index) => [
        date,
        {
          workoutName: `день ${index}`,
          activeKeys: ["warmUp"],
          texts: { warmUp: date },
        },
      ]),
    );
    const { result } = renderCopy(drafts);

    await act(async () => {
      await result.current.copyWeek();
    });

    const pasted = result.current.pasteWeek();

    expect(pasted).toEqual(
      dates.map((date, index) => ({
        workoutName: `день ${index}`,
        activeKeys: ["warmUp"],
        texts: { warmUp: date },
      })),
    );
    expect(JSON.stringify(pasted)).not.toContain("ivanov");
    expect(vi.mocked(fetch).mock.calls.some((call) =>
      requestUrl(call[0] as RequestInfo).includes("saveBuilderDay"),
    )).toBe(false);
  });

  it("копирует одну запись и шесть пустых дней, пропуская неизвестный ключ", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = new URL(requestUrl(input), "http://localhost");
        const date = url.searchParams.get("date") ?? "";

        if (date === "2026-11-03") {
          return jsonResponse(
            dayBody(date, { main: "40", extra: "скрыто" }),
          );
        }

        return jsonResponse(dayBody(date));
      }),
    );
    const drafts = new Map<string, WeekDayDraft>([
      [
        "2026-11-04",
        { workoutName: "Среда", activeKeys: ["warmUp"], texts: { warmUp: "10" } },
      ],
    ]);
    const { result } = renderCopy(drafts);

    await act(async () => {
      await result.current.copyWeek();
    });

    const pasted = result.current.pasteWeek();

    expect(pasted?.[1]).toEqual({
      workoutName: "",
      activeKeys: ["main"],
      texts: { main: "40" },
    });
    expect(pasted?.[2].texts.warmUp).toBe("10");
    expect(pasted?.filter((day) => day.activeKeys.length === 0)).toHaveLength(5);
    expect(JSON.stringify(pasted)).not.toContain("скрыто");
  });

  it("не меняет буфер, если записи нет ни у одного дня", async () => {
    const drafts = new Map(
      dates.map((date) => [date, emptyWeekDraft()] as const),
    );
    const { result } = renderCopy(drafts);

    await act(async () => {
      await result.current.copyWeek();
    });

    expect(result.current.hasWeek).toBe(false);
    expect(result.current.pasteWeek()).toBeNull();
  });

  it("повторное копирование заменяет буфер и не видит правку после копирования", async () => {
    const source: WeekDayDraft = {
      workoutName: "Было",
      activeKeys: ["note"],
      texts: { note: "раз" },
    };
    const drafts = new Map<string, WeekDayDraft>([
      ["2026-11-02", source],
      ...dates.slice(1).map((date) => [date, emptyWeekDraft()] as const),
    ]);
    const { result } = renderCopy(drafts);

    await act(async () => {
      await result.current.copyWeek();
    });

    source.texts.note = "два";
    drafts.set("2026-11-02", {
      workoutName: "Стало",
      activeKeys: ["note"],
      texts: { note: "два" },
    });

    expect(result.current.pasteWeek()?.[0].texts.note).toBe("раз");

    await act(async () => {
      await result.current.copyWeek();
    });

    expect(result.current.pasteWeek()?.[0].workoutName).toBe("Стало");
  });

  it("ответ не 200 не меняет буфер и вызывает alert", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ message: "Параметр date обязателен" }, 400),
      ),
    );
    const drafts = new Map<string, WeekDayDraft>([
      [
        "2026-11-02",
        { workoutName: "Пн", activeKeys: ["main"], texts: { main: "бег" } },
      ],
    ]);
    const { result } = renderCopy(drafts);

    await act(async () => {
      await result.current.copyWeek();
    });

    expect(alertMock).toHaveBeenCalledWith("Параметр date обязателен");
    expect(result.current.pasteWeek()).toBeNull();
  });
});
