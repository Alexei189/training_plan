import { baseApi } from "@/shared/api";

import { DayArgs, DayData, SaveBuilderDayBody } from "../model/types";

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
  }),
});

export const { useGetDayPlanQuery, useSaveBuilderDayMutation } = dayPlanApi;
