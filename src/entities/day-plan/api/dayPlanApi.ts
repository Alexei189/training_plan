import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

import { baseApi } from "@/shared/api";

import { DayArgs, DayData, SaveBuilderDayBody, SmartActionBody } from "../model/types";
import { notifySmartActionProgress } from "./smartActionProgress";

type SmartActionResult = { data: string } | { error: FetchBaseQueryError };

function aborted(): SmartActionResult {
  return { error: { status: "CUSTOM_ERROR", error: "aborted" } };
}

export const dayPlanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDayPlan: builder.query<DayData, DayArgs>({
      query: ({ date, athleteId }) => ({
        url: "/dayPlan",
        params: { date, athleteId },
      }),
      providesTags: ["DayPlan"],
    }),
    saveBuilderDay: builder.mutation<DayData, SaveBuilderDayBody>({
      query: (body) => ({
        url: "/saveBuilderDay",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DayPlan"],
    }),
    smartAction: builder.mutation<string, SmartActionBody>({
      queryFn: async (arg, api) => {
        try {
          const response = await fetch("/api/smartAction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: arg.date,
              athleteId: arg.athleteId,
              action: arg.action,
            }),
            signal: api.signal,
          });
          const contentType = response.headers.get("Content-Type") ?? "";

          if (!response.ok || !contentType.includes("text/event-stream")) {
            return { error: { status: response.status, data: await readError(response) } };
          }

          const reader = response.body?.getReader();

          if (!reader) {
            return {
              error: { status: 500, data: { message: "LLM недоступна" } },
            };
          }

          return await readEventStream(reader, api.signal);
        } catch (error) {
          if (isAbortError(error)) {
            return aborted();
          }

          return {
            error: { status: 500, data: { message: "LLM недоступна" } },
          };
        }
      },
    }),
  }),
});

async function readError(response: Response) {
  try {
    const data: unknown = await response.json();

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string" &&
      data.message.length > 0
    ) {
      return { message: data.message };
    }
  } catch {
    // Ответ без JSON остаётся общим сообщением ниже.
  }

  return { message: "LLM недоступна" };
}

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

async function readEventStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
): Promise<SmartActionResult> {
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  const takeEvents = (final: boolean): SmartActionResult | null => {
    if (final && buffer.trim()) {
      buffer += "\n\n";
    }

    const parts = buffer.split("\n\n");
    buffer = final ? "" : (parts.pop() ?? "");
    const ready = final ? parts.filter((part) => part.trim()) : parts;

    for (const part of ready) {
      const line = part
        .split("\n")
        .map((item) => item.trim())
        .find((item) => item.startsWith("data:"));

      if (!line) {
        continue;
      }

      const payload = line.slice("data:".length).trim();

      if (payload === "[DONE]") {
        return { data: accumulated };
      }

      let event: { text?: unknown; error?: unknown };

      try {
        event = JSON.parse(payload) as { text?: unknown; error?: unknown };
      } catch {
        return { error: { status: 200, data: { message: "LLM недоступна" } } };
      }

      if (typeof event.error === "string") {
        return { error: { status: 200, data: { message: event.error } } };
      }

      if (typeof event.text === "string" && event.text.length > 0) {
        accumulated += event.text;
        notifySmartActionProgress(accumulated);
      }
    }

    return null;
  };

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: !done });
      }

      const result = takeEvents(done);

      if (result) {
        return result;
      }

      if (done) {
        break;
      }
    }
  } catch (error) {
    if (isAbortError(error) || signal.aborted) {
      return aborted();
    }

    return { error: { status: 200, data: { message: "LLM недоступна" } } };
  }

  if (signal.aborted) {
    return aborted();
  }

  return { data: accumulated };
}

export const { useGetDayPlanQuery, useSaveBuilderDayMutation, useSmartActionMutation } =
  dayPlanApi;
