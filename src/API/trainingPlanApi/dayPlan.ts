// features/orders/ordersApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { DayArgs, TrainingDay } from "./types";

export const dayPlanApi = createApi({
  reducerPath: "dayPlanApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["DayPlan"],
  endpoints: (builder) => ({
    GetDayPlan: builder.query<TrainingDay[], DayArgs>({
      query: ({ date }) => ({
        url: "/trainingDay",
        params: { date },
      }),
      providesTags: ["DayPlan"],
    }),
  }),
});

export const { useGetDayPlanQuery } = dayPlanApi;
