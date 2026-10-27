import { baseApi } from "@/shared/api";

import { DayArgs, TrainingDay } from "../model/types";

export const dayPlanApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDayPlan: builder.query<TrainingDay[], DayArgs>({
      query: ({ date }) => ({
        url: "/trainingDay",
        params: { date },
      }),
      providesTags: ["DayPlan"],
    }),
  }),
});

export const { useGetDayPlanQuery } = dayPlanApi;
